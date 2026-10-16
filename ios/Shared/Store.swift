import Foundation
import WidgetKit

/// Общий ящик приложения и виджета.
///
/// App Group — единственный способ показать виджету данные страницы, не
/// выпуская их в сеть. Требует платной учётной записи разработчика: на
/// бесплатной группа не подписывается, контейнер не создаётся, и всё
/// внутри честно сообщит «нет данных» вместо выдуманного дня.
enum Store {
    static let groupID = "group.com.kslmvv.kamronapp"

    private static let snapshotKey = "day.snapshot"
    private static let marksKey = "day.marks"

    static var box: UserDefaults? { UserDefaults(suiteName: groupID) }

    /// Группа доступна только при верной подписи — проверяем честно.
    static var available: Bool { box != nil }

    // MARK: - Снимок дня

    static func save(raw: Data) {
        box?.set(raw, forKey: snapshotKey)
        WidgetCenter.shared.reloadAllTimelines()
    }

    static func snapshot() -> DaySnapshot? {
        guard let data = box?.data(forKey: snapshotKey) else { return nil }
        return try? JSONDecoder().decode(DaySnapshot.self, from: data)
    }

    static func write(_ snapshot: DaySnapshot) {
        guard let data = try? JSONEncoder().encode(snapshot) else { return }
        box?.set(data, forKey: snapshotKey)
    }

    // MARK: - Очередь отметок

    static func addMark(_ mark: PendingMark) {
        var list = marks()
        // Повторное нажатие не должно превращаться в две заявки.
        guard !list.contains(where: { $0.id == mark.id && $0.dateKey == mark.dateKey }) else { return }
        list.append(mark)
        if let data = try? JSONEncoder().encode(list) {
            box?.set(data, forKey: marksKey)
        }
    }

    static func marks() -> [PendingMark] {
        guard let data = box?.data(forKey: marksKey) else { return [] }
        return (try? JSONDecoder().decode([PendingMark].self, from: data)) ?? []
    }

    /// Забрать и очистить. Страница применит их один раз.
    static func takeMarks() -> [PendingMark] {
        let list = marks()
        box?.removeObject(forKey: marksKey)
        return list
    }

    /// Пока страница не ответила, виджет уже показывает блок закрытым:
    /// иначе кнопка выглядит сломанной — нажал, а ничего не поменялось.
    static func markDoneLocally(_ id: String) {
        guard var snap = snapshot() else { return }
        snap.blocks = snap.blocks.map { block in
            guard block.id == id else { return block }
            return DayBlock(
                id: block.id,
                title: block.title,
                icon: block.icon,
                from: block.from,
                to: block.to,
                status: "done"
            )
        }
        write(snap)
    }
}
