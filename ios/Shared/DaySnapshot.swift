import Foundation

/// Один блок режима дня в том виде, в каком его присылает страница.
///
/// Время хранится в минутах от полуночи, а не датой: страница и виджет
/// живут в одном часовом поясе, зато такой снимок не протухает в полночь
/// и его можно сравнивать с текущим временем без разбора дат.
struct DayBlock: Codable, Hashable, Identifiable {
    let id: String
    let title: String
    /// Эмодзи задачи — то же, что страница показывает в списке.
    let icon: String
    let from: Int
    let to: Int
    /// done | missed | open | early
    let status: String

    var isDone: Bool { status == "done" }
    var isMissed: Bool { status == "missed" }

    func covers(_ minute: Int) -> Bool { minute >= from && minute < to }
}

/// Снимок дня. Виджет не считает режим сам — он показывает то, что
/// посчитала страница, и только текущее время берёт у системы.
struct DaySnapshot: Codable {
    var dateKey: String
    var updatedAt: Double
    var pct: Int
    var missed: Int
    /// calm | focus | happy | worry | angry | sleep
    var mood: String
    var blocks: [DayBlock]

    /// Блок, который идёт прямо сейчас.
    func current(at minute: Int) -> DayBlock? {
        blocks.first { $0.covers(minute) }
    }

    /// Ближайшие блоки после текущего.
    func upcoming(at minute: Int, limit: Int) -> [DayBlock] {
        blocks.filter { $0.from >= minute }.prefix(limit).map { $0 }
    }

    /// Снимок за прошлый день показывать нельзя: это молчаливое враньё.
    /// Лучше честная надпись «нет данных», чем вчерашний план.
    func isFresh(for date: Date = Date()) -> Bool {
        dateKey == DaySnapshot.key(for: date)
    }

    static func key(for date: Date) -> String {
        let f = DateFormatter()
        f.calendar = Calendar(identifier: .gregorian)
        f.locale = Locale(identifier: "en_US_POSIX")
        f.dateFormat = "yyyy-MM-dd"
        return f.string(from: date)
    }

    static func minutes(of date: Date) -> Int {
        let c = Calendar.current.dateComponents([.hour, .minute], from: date)
        return (c.hour ?? 0) * 60 + (c.minute ?? 0)
    }

    /// Начало суток нужно, чтобы превратить минуты блока в настоящую дату
    /// для живого таймера на экране блокировки.
    static func moment(_ minute: Int, on date: Date = Date()) -> Date {
        let start = Calendar.current.startOfDay(for: date)
        return start.addingTimeInterval(TimeInterval(minute * 60))
    }

    /// Диапазон для живого таймера. Конец, который уже позади, даёт
    /// перевёрнутый диапазон, а на нём SwiftUI падает — поэтому хвост
    /// всегда держим хотя бы на секунду впереди.
    static func countdown(to end: Date, from now: Date = Date()) -> ClosedRange<Date> {
        let safeEnd = max(end, now.addingTimeInterval(1))
        return now...safeEnd
    }

    /// Стоит ли показывать живой отсчёт с секундами.
    ///
    /// Бегущие 12:26:13 до конца выходного — шум: цифры мелькают, а
    /// смысла в них нет. Секунды нужны, когда дело вот-вот кончится.
    static func ticking(until end: Date, from now: Date = Date()) -> Bool {
        let left = end.timeIntervalSince(now)
        return left > 0 && left <= 90 * 60
    }

    /// Спокойный остаток: «12 ч 26» или «48 мин».
    static func rough(until end: Date, from now: Date = Date()) -> String {
        let left = max(0, Int(end.timeIntervalSince(now) / 60))
        if left < 60 { return "\(left) мин" }
        let h = left / 60, m = left % 60
        return m == 0 ? "\(h) ч" : "\(h) ч \(m)"
    }

    static let empty = DaySnapshot(
        dateKey: "",
        updatedAt: 0,
        pct: 0,
        missed: 0,
        mood: "calm",
        blocks: []
    )

    /// Заглушка для галереи виджетов: там нельзя показывать пустоту,
    /// иначе человек не понимает, что он добавляет на экран.
    static let sample = DaySnapshot(
        dateKey: DaySnapshot.key(for: Date()),
        updatedAt: Date().timeIntervalSince1970,
        pct: 64,
        missed: 2,
        mood: "focus",
        blocks: [
            DayBlock(id: "work", title: "Работа", icon: "💼", from: 13 * 60 + 30, to: 19 * 60 + 30, status: "open"),
            DayBlock(id: "road", title: "Дорога домой", icon: "🚇", from: 19 * 60 + 30, to: 20 * 60 + 20, status: "open"),
            DayBlock(id: "eng", title: "Английский", icon: "🇬🇧", from: 20 * 60 + 30, to: 21 * 60 + 30, status: "open"),
            DayBlock(id: "film", title: "Кино", icon: "🎬", from: 22 * 60, to: 23 * 60 + 30, status: "open")
        ]
    )
}

/// Отметка, сделанная кнопкой в виджете. Страница — единственный хозяин
/// данных, поэтому виджет не меняет режим, а кладёт заявку в очередь:
/// приложение отдаст её странице, и та решит, что с ней делать.
struct PendingMark: Codable {
    let id: String
    let dateKey: String
    let at: Double
}
