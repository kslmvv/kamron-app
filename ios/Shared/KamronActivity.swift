import Foundation
import ActivityKit

/// Живое уведомление о текущем блоке: экран блокировки и Динамический остров.
///
/// Таймер внутри не пересылается с каждой минутой — отдаётся конец блока,
/// а секунды система считает сама. Поэтому отсчёт идёт живым даже когда
/// приложение закрыто и обновить содержимое некому.
struct KamronActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var blockID: String
        var title: String
        var icon: String
        var startedAt: Date
        var endsAt: Date
        var pct: Int
        var missed: Int
        var mood: String
        var done: Bool
    }

    /// Неизменная часть: день, к которому относится отсчёт.
    var dateKey: String
}
