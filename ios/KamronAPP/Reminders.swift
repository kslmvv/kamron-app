import Foundation
import UserNotifications
import WidgetKit

/// План напоминаний в том виде, в каком его присылает страница.
///
/// Страница остаётся единственным хозяином режима дня: она сама решает,
/// что считается делом, что окном и какие дела вообще можно отмечать.
/// Приложению остаётся разложить это по будильникам системы.
///
/// Все поля с умолчаниями, и это важнее, чем кажется. Разбор строгий:
/// одно недостающее поле — и план не разбирается целиком, а значит
/// напоминания пропадают молча, без следа и без жалоб. Копия состояния
/// могла быть снята версией, где поля ещё не было.
struct NotifPlan: Decodable {
    struct Block: Decodable {
        let id: String
        let title: String
        /// Минуты от полуночи — как и везде в снимке дня.
        let from: Int
        let to: Int
        /// Вид блока: «window» — свободное окно, остальное неважно.
        let kind: String
        /// Можно ли это дело отмечать: у режимных блоков вроде сна
        /// отметки нет, напоминать о закрытии нечего.
        let checkable: Bool
        let done: Bool

        enum Keys: String, CodingKey { case id, title, from, to, kind, checkable, done }

        init(from decoder: Decoder) throws {
            let c = try decoder.container(keyedBy: Keys.self)
            id = try c.decode(String.self, forKey: .id)
            title = (try? c.decode(String.self, forKey: .title)) ?? ""
            from = try c.decode(Int.self, forKey: .from)
            to = try c.decode(Int.self, forKey: .to)
            kind = (try? c.decode(String.self, forKey: .kind)) ?? ""
            checkable = (try? c.decode(Bool.self, forKey: .checkable)) ?? false
            done = (try? c.decode(Bool.self, forKey: .done)) ?? false
        }
    }

    struct Day: Decodable {
        let dateKey: String
        let blocks: [Block]
        /// Разбор за этот день уже закрыт — напоминать не о чем.
        let reviewClosed: Bool

        enum Keys: String, CodingKey { case dateKey, blocks, reviewClosed }

        init(from decoder: Decoder) throws {
            let c = try decoder.container(keyedBy: Keys.self)
            dateKey = try c.decode(String.self, forKey: .dateKey)
            blocks = (try? c.decode([Block].self, forKey: .blocks)) ?? []
            reviewClosed = (try? c.decode(Bool.self, forKey: .reviewClosed)) ?? false
        }
    }

    struct Prefs: Decodable {
        let on: Bool
        let pre: Bool
        let win: Bool
        let end: Bool
        let rev: Bool

        enum Keys: String, CodingKey { case on, pre, win, end, rev }

        init(from decoder: Decoder) throws {
            let c = try decoder.container(keyedBy: Keys.self)
            on = (try? c.decode(Bool.self, forKey: .on)) ?? false
            pre = (try? c.decode(Bool.self, forKey: .pre)) ?? true
            win = (try? c.decode(Bool.self, forKey: .win)) ?? true
            end = (try? c.decode(Bool.self, forKey: .end)) ?? true
            rev = (try? c.decode(Bool.self, forKey: .rev)) ?? true
        }
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
    /// только свои. Проверочное уведомление держим под другой: иначе
    /// план, пришедший в те же пять секунд, снесёт саму проверку.
    private static let prefix = "k."
    private static let testID = "kamron.test"

    /// Потолок системы — 64 ожидающих уведомления на приложение, лишние
    /// молча отбрасываются. Держимся ниже с запасом: лучше не завести
    /// напоминание на послезавтра, чем потерять сегодняшнее. Дни идут по
    /// порядку, поэтому обрезается всегда самый дальний.
    private static let limit = 56

    /// Работа с центром уведомлений идёт в одну нитку.
    ///
    /// Каждая операция — это два-три асинхронных перехода (спросить
    /// разрешение, забрать список ожидающих, удалить, добавить). Два
    /// плана подряд — обычное дело: отметил дело и сразу передвинул
    /// время. Без очереди их шаги перемешиваются, и «удалить старое» от
    /// второго может прийти после «добавить новое» от него же.
    private static let queue = DispatchQueue(label: "kamron.reminders")

    /// Номер последнего принятого плана. Пока запрос разрешения ждёт
    /// человека, страница успевает прислать ещё один-два плана, и
    /// применить потом нужно свежий, а не тот, что лежал в замыкании.
    private static var version = 0

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
    /// (Если переключатель уже был включён раньше — например, вернулся
    /// из копии, — запрос придёт на первом же плане, и это правильно:
    /// человек это однажды выбрал.)
    static func apply(_ plan: NotifPlan) {
        queue.async {
            version += 1
            let mine = version

            guard plan.notif.on else {
                clearSync()
                report()
                return
            }

            /* Отсюда и дальше — без ожидания. Ответ системы придёт на
               её собственной нитке и сам положит работу обратно в эту
               очередь. Ждать его прямо здесь нельзя: очередь
               последовательная, и она же нужна той работе — получилась
               бы взаимная блокировка. */
            let center = UNUserNotificationCenter.current()
            center.getNotificationSettings { settings in
                switch settings.authorizationStatus {
                case .notDetermined:
                    center.requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
                        if granted { queue.async { scheduleSync(plan, version: mine) } }
                        report()
                    }
                case .denied:
                    report()
                default:
                    queue.async { scheduleSync(plan, version: mine) }
                    report()
                }
            }
        }
    }

    /// Снимаем свои будильники и заводим заново.
    ///
    /// Перезавод целиком, а не правка по одному: план меняется от любой
    /// мелочи — передвинул пару, отметил дело, выключил переключатель, —
    /// и сверять два списка дороже и ошибочнее, чем составить заново.
    private static func scheduleSync(_ plan: NotifPlan, version mine: Int) {
        // План устарел, пока мы ждали человека или систему.
        guard mine == version else { return }

        let center = UNUserNotificationCenter.current()
        clearSync()

        var made = 0
        outer: for day in plan.days {
            for item in requests(for: day, prefs: plan.notif, reviewAt: plan.reviewAt) {
                guard made < limit else { break outer }
                center.add(item)
                made += 1
            }
        }
    }

    static func clear() {
        queue.async { clearSync() }
    }

    /// Снимаем строго свои заявки и дожидаемся конца: очередь
    /// последовательная только если шаги в ней действительно
    /// последовательны, а getPendingNotificationRequests асинхронный.
    private static func clearSync() {
        let center = UNUserNotificationCenter.current()
        let group = DispatchGroup()
        group.enter()
        center.getPendingNotificationRequests { pending in
            let ours = pending.map(\.identifier).filter { $0.hasPrefix(prefix) }
            if !ours.isEmpty {
                center.removePendingNotificationRequests(withIdentifiers: ours)
            }
            group.leave()
        }
        group.wait()
    }

    /// Проверка из настроек.
    ///
    /// Показать всплывашку в приложении недостаточно: вопрос у человека
    /// ровно один — дойдёт ли уведомление, когда приложение закрыто.
    /// Поэтому заводим настоящее, через пять секунд.
    static func test() {
        let center = UNUserNotificationCenter.current()
        center.getNotificationSettings { settings in
            guard settings.authorizationStatus == .authorized ||
                  settings.authorizationStatus == .provisional else {
                report()
                return
            }

            let content = UNMutableNotificationContent()
            content.title = "Проверка"
            content.body = "Так выглядит напоминание о деле."
            content.sound = .default

            center.add(UNNotificationRequest(
                identifier: testID,
                content: content,
                trigger: UNTimeIntervalNotificationTrigger(timeInterval: 5, repeats: false)
            ))
        }
    }

    /// Снять напоминания про одно дело — когда его отметили прямо в
    /// уведомлении.
    ///
    /// Из виджета это не позвать: `MarkDoneIntent` живёт в расширении,
    /// куда этот файл не собирается. Поэтому отметка из виджета при
    /// закрытом приложении напоминание не снимает — план перезаведётся
    /// при следующем открытии. Так и описано в ios/README.md.
    static func drop(blockID: String, dateKey: String) {
        let ids = ["pre", "win", "end"].map { id(dateKey, $0, blockID) }
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: ids)
        // Уже показанное тоже убираем, иначе «закрывается» висит в
        // центре уведомлений над закрытым делом.
        center.removeDeliveredNotifications(withIdentifiers: ids)
    }

    // MARK: - Состояние разрешения для страницы

    /// Страница сама про разрешение ничего не знает: `Notification`
    /// внутри обёртки свой и к системным уведомлениям отношения не
    /// имеет. Без этого ответа экран настроек показывал бы «разрешено»
    /// человеку, который нажал «Не разрешать», а кнопка проверки молча
    /// не делала бы ничего.
    static var onState: ((Bool) -> Void)?

    private static func report() {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            let ok = settings.authorizationStatus == .authorized ||
                     settings.authorizationStatus == .provisional
            DispatchQueue.main.async { onState?(ok) }
        }
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
                /* Без кнопки «Сделал» нарочно: дело ещё не началось.
                   Страница такую отметку отвергает (раньше начала —
                   нечестно), а оболочка к тому моменту уже погасила бы
                   напоминание и закрасила блок. Человек был бы уверен,
                   что закрыл дело, а оно ушло бы в упущенные. */
                out.append(contentsOf: make(
                    day: day.dateKey, minute: block.from - 10, type: "pre", block: block,
                    title: "Через 10 минут: " + block.title,
                    body: hm(block.from) + " — " + hm(block.to) + ". Собирайся.",
                    withDone: false
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

        if prefs.rev, !day.reviewClosed {
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
            // Иначе блок закрашен в ящике, а на домашнем экране — нет.
            WidgetCenter.shared.reloadAllTimelines()
        }
    }
}
