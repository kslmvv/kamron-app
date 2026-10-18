import Foundation
import UserNotifications


/// План напоминаний в том виде, в каком его присылает страница.
///
/// Страница остаётся единственным хозяином режима дня: она сама решает,
/// что считается делом, что окном и какие дела вообще можно отмечать.
/// Приложению остаётся разложить это по будильникам системы.
struct NotifPlan: Decodable {
    struct Block: Decodable {
        let id: String
        let title: String
        let icon: String
        /// Минуты от полуночи — как и везде в снимке дня.
        let from: Int
        let to: Int
        /// Вид блока: «window» — свободное окно, остальное неважно.
        let kind: String
        /// Можно ли это дело отмечать: у режимных блоков вроде сна
        /// отметки нет, напоминать о закрытии нечего.
        let checkable: Bool
        let done: Bool
    }

    struct Day: Decodable {
        let dateKey: String
        let blocks: [Block]
    }

    struct Prefs: Decodable {
        let on: Bool
        let pre: Bool
        let win: Bool
        let end: Bool
        let rev: Bool
    }

    /// Время вечернего разбора, минуты от полуночи.
    let reviewAt: Int
    let notif: Prefs
    let days: [Day]
}

/// Локальные уведомления о делах дня.
///
/// Почему не уведомления страницы: `new Notification` живёт ровно пока
/// открыта вкладка. То есть срабатывает только когда человек и так
/// смотрит в приложение, а в единственный важный момент — телефон в
/// кармане, приложение закрыто — не делает ничего. Системные будильники
/// заводятся заранее и не зависят ни от приложения, ни от сети.
enum Reminders {

    /// Один раз за запуск: категории и делегат должны быть на месте до
    /// того, как система доставит первое нажатие.
    private static let delegate = Delegate()

    static let category = "KAMRON_BLOCK"
    static let doneAction = "KAMRON_DONE"

    /// Наши заявки среди чужих узнаём по приставке — чистить нужно
    /// только свои.
    private static let prefix = "k."

    /// Потолок системы — 64 ожидающих уведомления на приложение, лишние
    /// молча отбрасываются. Держимся ниже с запасом: лучше не завести
    /// напоминание на послезавтра, чем потерять сегодняшнее.
    private static let limit = 56

    static func register() {
        let done = UNNotificationAction(
            identifier: doneAction,
            title: "Сделал",
            options: []
        )
        let blockCategory = UNNotificationCategory(
            identifier: category,
            actions: [done],
            intentIdentifiers: [],
            options: []
        )
        let center = UNUserNotificationCenter.current()
        center.delegate = delegate
        center.setNotificationCategories([blockCategory])
    }

    /// Разрешение спрашиваем не при запуске, а когда человек включил
    /// напоминания у себя в настройках: вопрос в пустоту на первом
    /// экране почти всегда получает «нет», и второй раз его не задать.
    static func apply(_ plan: NotifPlan) {
        guard plan.notif.on else {
            clear()
            return
        }
        let center = UNUserNotificationCenter.current()
        center.getNotificationSettings { settings in
            switch settings.authorizationStatus {
            case .notDetermined:
                center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
                    if granted { schedule(plan) }
                }
            case .denied:
                break
            default:
                schedule(plan)
            }
        }
    }

    /// Снимаем свои будильники и заводим заново.
    ///
    /// Перезавод целиком, а не правка по одному: план меняется от любой
    /// мелочи — передвинул пару, отметил дело, выключил переключатель, —
    /// и сверять два списка дороже и ошибочнее, чем составить заново.
    private static func schedule(_ plan: NotifPlan) {
        let center = UNUserNotificationCenter.current()
        center.getPendingNotificationRequests { pending in
            let ours = pending.map(\.identifier).filter { $0.hasPrefix(prefix) }
            center.removePendingNotificationRequests(withIdentifiers: ours)

            var made = 0
            for day in plan.days {
                for item in requests(for: day, prefs: plan.notif, reviewAt: plan.reviewAt) {
                    guard made < limit else { return }
                    center.add(item)
                    made += 1
                }
            }
        }
    }

    /// Проверка из настроек.
    ///
    /// Показать всплывашку в приложении недостаточно: вопрос у человека
    /// ровно один — дойдёт ли уведомление, когда приложение закрыто.
    /// Поэтому заводим настоящее, через пять секунд, и просим свернуть.
    static func test() {
        let center = UNUserNotificationCenter.current()
        center.getNotificationSettings { settings in
            guard settings.authorizationStatus == .authorized ||
                  settings.authorizationStatus == .provisional else { return }

            let content = UNMutableNotificationContent()
            content.title = "Проверка"
            content.body = "Так выглядит напоминание о деле."
            content.sound = .default

            center.add(UNNotificationRequest(
                identifier: prefix + "test",
                content: content,
                trigger: UNTimeIntervalNotificationTrigger(timeInterval: 5, repeats: false)
            ))
        }
    }

    static func clear() {
        let center = UNUserNotificationCenter.current()
        center.getPendingNotificationRequests { pending in
            let ours = pending.map(\.identifier).filter { $0.hasPrefix(prefix) }
            center.removePendingNotificationRequests(withIdentifiers: ours)
        }
    }

    /// Снять напоминания про одно дело — когда его уже отметили кнопкой
    /// в виджете или прямо в уведомлении. Иначе через полчаса прилетит
    /// «закрывается» про то, что закрыто.
    static func drop(blockID: String, dateKey: String) {
        UNUserNotificationCenter.current().removePendingNotificationRequests(
            withIdentifiers: ["pre", "win", "end"].map { id(dateKey, $0, blockID) }
        )
    }

    // MARK: - Сборка заявок

    private static func id(_ dateKey: String, _ type: String, _ blockID: String) -> String {
        "\(prefix)\(dateKey).\(type).\(blockID)"
    }

    private static func requests(
        for day: NotifPlan.Day,
        prefs: NotifPlan.Prefs,
        reviewAt: Int
    ) -> [UNNotificationRequest] {
        var out: [UNNotificationRequest] = []

        for block in day.blocks where !block.done {
            if prefs.pre, block.checkable {
                out.append(contentsOf: make(
                    day: day.dateKey, minute: block.from - 10, type: "pre", block: block,
                    title: "Через 10 минут: " + block.title,
                    body: hm(block.from) + " — " + hm(block.to) + ". Собирайся.",
                    withDone: true
                ))
            }
            if prefs.win, block.kind == "window" {
                out.append(contentsOf: make(
                    day: day.dateKey, minute: block.from, type: "win", block: block,
                    title: "Окно до " + hm(block.to),
                    body: "Сделай уроки сейчас — вечером их не будет.",
                    withDone: false
                ))
            }
            if prefs.end, block.checkable {
                out.append(contentsOf: make(
                    day: day.dateKey, minute: block.to, type: "end", block: block,
                    title: block.title + " закрывается",
                    body: "Отметить можно до " + hm(block.to + 15) + ", дальше дело уйдёт.",
                    withDone: true
                ))
            }
        }

        if prefs.rev {
            let content = UNMutableNotificationContent()
            content.title = "Разбор дня"
            content.body = "Отметь, что получилось, а что нет."
            content.sound = .default
            if let trigger = trigger(day: day.dateKey, minute: reviewAt) {
                out.append(UNNotificationRequest(
                    identifier: id(day.dateKey, "rev", "day"),
                    content: content,
                    trigger: trigger
                ))
            }
        }

        return out
    }

    /// Возвращает ноль или одну заявку: время, которое уже прошло,
    /// заводить нельзя — система выстрелит таким уведомлением сразу.
    private static func make(
        day dateKey: String,
        minute: Int,
        type: String,
        block: NotifPlan.Block,
        title: String,
        body: String,
        withDone: Bool
    ) -> [UNNotificationRequest] {
        guard let trigger = trigger(day: dateKey, minute: minute) else { return [] }

        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        if withDone {
            content.categoryIdentifier = category
            // Кнопке «Сделал» нужно знать, что именно закрывать: система
            // вернёт этот словарь вместе с нажатием.
            content.userInfo = ["blockID": block.id, "dateKey": dateKey]
        }

        return [UNNotificationRequest(
            identifier: id(dateKey, type, block.id),
            content: content,
            trigger: trigger
        )]
    }

    private static func trigger(day dateKey: String, minute: Int) -> UNCalendarNotificationTrigger? {
        guard minute >= 0, minute < 24 * 60 else { return nil }
        let parts = dateKey.split(separator: "-").compactMap { Int($0) }
        guard parts.count == 3 else { return nil }

        var when = DateComponents()
        when.year = parts[0]
        when.month = parts[1]
        when.day = parts[2]
        when.hour = minute / 60
        when.minute = minute % 60

        guard let date = Calendar.current.date(from: when), date > Date() else { return nil }
        return UNCalendarNotificationTrigger(dateMatching: when, repeats: false)
    }

    private static func hm(_ minute: Int) -> String {
        String(format: "%02d:%02d", (minute / 60) % 24, minute % 60)
    }

    // MARK: - Нажатия

    private final class Delegate: NSObject, UNUserNotificationCenterDelegate {

        /// Пока приложение открыто, баннер не нужен: день и так перед
        /// глазами, а страница показывает своё сообщение сама.
        func userNotificationCenter(
            _ center: UNUserNotificationCenter,
            willPresent notification: UNNotification,
            withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
        ) {
            completionHandler([])
        }

        func userNotificationCenter(
            _ center: UNUserNotificationCenter,
            didReceive response: UNNotificationResponse,
            withCompletionHandler completionHandler: @escaping () -> Void
        ) {
            defer { completionHandler() }
            guard response.actionIdentifier == Reminders.doneAction else { return }

            let info = response.notification.request.content.userInfo
            guard let blockID = info["blockID"] as? String,
                  let dateKey = info["dateKey"] as? String else { return }

            /* Отметку ставит страница, как и для кнопки в виджете: второго
               места, где считается режим дня, быть не должно. Здесь только
               заявка — она переживёт закрытое приложение. */
            Store.markDoneLocally(blockID)
            Store.addMark(PendingMark(id: blockID, dateKey: dateKey, at: Date().timeIntervalSince1970))
            Reminders.drop(blockID: blockID, dateKey: dateKey)
        }
    }
}
