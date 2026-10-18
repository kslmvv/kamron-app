import Foundation
import WebKit
import ActivityKit
import WidgetKit

/// Мост между страницей и системой.
///
/// Страница остаётся единственным хозяином данных: она присылает снимок
/// дня, а приложение только раскладывает его по виджету и живому
/// уведомлению. Обратно идут отметки, сделанные кнопкой в виджете.
final class Bridge: NSObject, WKScriptMessageHandler {
    static let channel = "kamron"

    /// Представление назначается после создания: WebKit копирует
    /// настройки в момент инициализации, поэтому обработчик сообщений
    /// приходится зарегистрировать раньше, чем появится сам WKWebView.
    weak var webView: WKWebView?

    func userContentController(
        _ controller: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        guard message.name == Bridge.channel,
              let body = message.body as? [String: Any],
              let kind = body["kind"] as? String else { return }

        switch kind {
        case "day":
            accept(day: body["day"])
        case "ready":
            flushMarks()
        default:
            break
        }
    }

    // MARK: - Снимок дня

    private func accept(day: Any?) {
        guard let day,
              let raw = try? JSONSerialization.data(withJSONObject: day),
              let snapshot = try? JSONDecoder().decode(DaySnapshot.self, from: raw) else { return }

        Store.write(snapshot)
        WidgetCenter.shared.reloadAllTimelines()
        LiveDay.sync(with: snapshot)
        flushMarks()
    }

    // MARK: - Передача ключа странице

    /// При первом запуске хранилище у приложения своё и пустое: данные,
    /// накопленные в Safari, сюда не переезжают. Поэтому отдаём странице
    /// ключ, и она возвращает всё из последней копии сама. Повторный
    /// вызов безвреден — страница с уже настроенной связью его не примет.
    func handOverKey() {
        guard !AppSecrets.server.isEmpty, !AppSecrets.token.isEmpty, let webView else { return }
        let url = escaped(AppSecrets.server)
        let token = escaped(AppSecrets.token)
        webView.evaluateJavaScript("window.kamronLink && window.kamronLink('\(url)', '\(token)')")
    }

    /// Значения уходят в строку JavaScript, поэтому кавычки и обратные
    /// косые экранируем: иначе ключ с апострофом сломает весь вызов.
    private func escaped(_ value: String) -> String {
        value
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "'", with: "\\'")
            .replacingOccurrences(of: "\n", with: "")
    }

    // MARK: - Отметки из виджета

    /// Отдаём странице то, что человек нажал в виджете, пока приложение
    /// было закрыто. Страница применит отметки сама — так не появится
    /// второго места, где считается режим дня.
    func flushMarks() {
        let marks = Store.takeMarks()
        guard !marks.isEmpty,
              let data = try? JSONEncoder().encode(marks),
              let json = String(data: data, encoding: .utf8),
              let webView else { return }

        webView.evaluateJavaScript("window.kamronApply && window.kamronApply(\(json))") { _, error in
            // Если страница ещё не готова — заявки не теряем, вернём их обратно.
            if error != nil {
                marks.forEach(Store.addMark)
            }
        }
    }
}

// MARK: - Живое уведомление

/// Управление живым уведомлением о текущем блоке.
enum LiveDay {
    @available(iOS 16.2, *)
    private static var running: Activity<KamronActivityAttributes>? {
        Activity<KamronActivityAttributes>.activities.first
    }

    static func sync(with snapshot: DaySnapshot) {
        guard #available(iOS 16.2, *) else { return }
        guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }

        let now = Date()
        guard snapshot.isFresh(for: now) else {
            stop()
            return
        }

        let minute = DaySnapshot.minutes(of: now)
        guard let block = snapshot.current(at: minute) else {
            stop()
            return
        }

        let state = KamronActivityAttributes.ContentState(
            blockID: block.id,
            title: block.title,
            icon: block.icon,
            startedAt: DaySnapshot.moment(block.from, on: now),
            endsAt: DaySnapshot.moment(block.to, on: now),
            pct: snapshot.pct,
            missed: snapshot.missed,
            mood: snapshot.mood,
            done: block.isDone
        )

        if let activity = running {
            Task {
                // Уведомление само исчезнет к концу блока, даже если
                // приложение к тому времени никто не откроет.
                await activity.update(
                    ActivityContent(state: state, staleDate: state.endsAt)
                )
            }
        } else {
            _ = try? Activity<KamronActivityAttributes>.request(
                attributes: KamronActivityAttributes(dateKey: snapshot.dateKey),
                content: ActivityContent(state: state, staleDate: state.endsAt),
                pushType: nil
            )
        }
    }

    static func stop() {
        guard #available(iOS 16.2, *) else { return }
        Task {
            for activity in Activity<KamronActivityAttributes>.activities {
                await activity.end(nil, dismissalPolicy: .immediate)
            }
        }
    }
}
