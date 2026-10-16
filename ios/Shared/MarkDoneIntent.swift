import AppIntents
import WidgetKit

/// Кнопка «Сделал» из виджета и живого уведомления.
///
/// Виджет не хозяин данных: он кладёт заявку в общий ящик и сразу
/// закрашивает блок у себя, чтобы нажатие не выглядело пустым. Настоящую
/// отметку поставит страница, когда приложение откроется.
@available(iOS 17.0, *)
struct MarkDoneIntent: LiveActivityIntent {
    static var title: LocalizedStringResource = "Отметить сделанным"
    static var description = IntentDescription("Закрывает текущий блок режима дня.")

    /// Запускать приложение ради отметки не нужно: заявка переживёт
    /// закрытое приложение и применится при следующем открытии.
    static var openAppWhenRun: Bool = false

    @Parameter(title: "Блок")
    var blockID: String

    @Parameter(title: "День")
    var dateKey: String

    init() {}

    init(blockID: String, dateKey: String) {
        self.blockID = blockID
        self.dateKey = dateKey
    }

    func perform() async throws -> some IntentResult {
        Store.addMark(PendingMark(id: blockID, dateKey: dateKey, at: Date().timeIntervalSince1970))
        Store.markDoneLocally(blockID)
        WidgetCenter.shared.reloadAllTimelines()
        return .result()
    }
}
