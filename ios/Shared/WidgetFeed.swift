import Foundation

/// Запасной путь к дню — через сервер.
///
/// Нужен там, где Apple не дала приложению и виджету общий ящик на
/// устройстве: без общего ящика процесс виджета попросту не видит, что
/// записало приложение. Тогда страница кладёт день на свой сервер, а
/// виджет его оттуда читает.
///
/// Ключ здесь отдельный и короткий в правах: он лежит в собранном
/// приложении на телефоне, поэтому главный ключ сюда класть нельзя —
/// им открывается переписка, резервные копии и расходы.
enum WidgetFeed {
    /// Настраивается в `Secrets.swift` — файл не в репозитории.
    static var isConfigured: Bool {
        !Secrets.server.isEmpty && !Secrets.widgetToken.isEmpty
    }

    private static var base: String {
        Secrets.server.hasSuffix("/") ? String(Secrets.server.dropLast()) : Secrets.server
    }

    private static func request(_ path: String, method: String = "GET", body: Data? = nil) -> URLRequest? {
        guard isConfigured, let url = URL(string: base + path) else { return nil }
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.timeoutInterval = 12
        request.setValue("Bearer " + Secrets.widgetToken, forHTTPHeaderField: "authorization")
        if let body {
            request.httpBody = body
            request.setValue("application/json", forHTTPHeaderField: "content-type")
        }
        return request
    }

    /// День с сервера. Нет сети — вернётся последний удачный ответ:
    /// виджет с позавчерашним планом бесполезен, но пустой виджет при
    /// каждом провале связи раздражает сильнее.
    static func day() async -> DaySnapshot? {
        guard let request = request("/api/widget") else { return nil }
        do {
            let (data, response) = try await URLSession.shared.data(for: request)
            guard (response as? HTTPURLResponse)?.statusCode == 200 else { return cached() }
            let snapshot = try JSONDecoder().decode(DaySnapshot.self, from: data)
            Store.write(snapshot)
            return snapshot
        } catch {
            return cached()
        }
    }

    private static func cached() -> DaySnapshot? { Store.snapshot() }

    /// Отметка уходит в ту же очередь, что и надиктованное боту: страница
    /// заберёт её при следующем открытии и проверит время по своим правилам.
    static func send(mark: PendingMark) async -> Bool {
        let payload: [String: Any] = ["id": mark.id, "dateKey": mark.dateKey, "at": mark.at]
        guard let body = try? JSONSerialization.data(withJSONObject: payload),
              let request = request("/api/widget/mark", method: "POST", body: body) else { return false }
        guard let (_, response) = try? await URLSession.shared.data(for: request) else { return false }
        return (response as? HTTPURLResponse)?.statusCode == 200
    }
}
