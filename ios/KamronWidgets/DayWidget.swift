import WidgetKit
import SwiftUI

// MARK: - Кадр таймлайна

struct DayEntry: TimelineEntry {
    let date: Date
    let snapshot: DaySnapshot?
    let pose: PetPose
    /// Группа не подписана — об этом надо сказать прямо, а не рисовать пустоту.
    let blocked: Bool
}

// MARK: - Поставщик кадров

struct DayProvider: TimelineProvider {
    func placeholder(in context: Context) -> DayEntry {
        DayEntry(date: Date(), snapshot: .sample, pose: .still, blocked: false)
    }

    func getSnapshot(in context: Context, completion: @escaping (DayEntry) -> Void) {
        let snap = context.isPreview ? DaySnapshot.sample : Store.snapshot()
        completion(DayEntry(date: Date(), snapshot: snap, pose: .still, blocked: !Store.available))
    }

    /// Кадры на час вперёд, по одному в минуту.
    ///
    /// Они отрисованы заранее, поэтому не тратят лимит обновлений: система
    /// показывает готовые кадры сама. Через час виджет попросит следующую
    /// порцию — к этому времени и данные успеют обновиться.
    func getTimeline(in context: Context, completion: @escaping (Timeline<DayEntry>) -> Void) {
        let snap = Store.snapshot()
        let blocked = !Store.available
        let now = Date()
        let start = Calendar.current.date(bySetting: .second, value: 0, of: now) ?? now

        var entries: [DayEntry] = []
        for step in 0..<60 {
            let date = start.addingTimeInterval(TimeInterval(step * 60))
            entries.append(
                DayEntry(date: date, snapshot: snap, pose: PetPose.at(step), blocked: blocked)
            )
        }

        completion(Timeline(entries: entries, policy: .atEnd))
    }
}

// MARK: - Виджет

struct DayWidget: Widget {
    let kind = "KamronDayWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DayProvider()) { entry in
            DayWidgetView(entry: entry)
                .containerBackground(for: .widget) {
                    DayBackground(entry: entry)
                }
        }
        .configurationDisplayName("День")
        .description("Что сейчас, сколько осталось и сколько блоков мимо.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

/// Фон говорит о дне раньше текста: лайм — идёшь по плану, красный —
/// блок упущен, тёмный — день закрыт.
struct DayBackground: View {
    let entry: DayEntry

    var body: some View {
        let state = entry.state
        switch state.tone {
        case .day: Palette.day
        case .alarm: Palette.alarm
        case .night: Palette.night
        }
    }
}

// MARK: - Разбор состояния

enum DayTone { case day, alarm, night }

struct DayState {
    var snapshot: DaySnapshot?
    var current: DayBlock?
    var next: [DayBlock]
    var minute: Int
    var tone: DayTone
    var mood: PetMood
    var fresh: Bool
    var blocked: Bool

    var skin: Color {
        tone == .night ? Palette.lime : .white
    }

    var textColor: Color {
        tone == .night ? .white : Palette.ink
    }

    var dimColor: Color {
        tone == .night ? Color.white.opacity(0.55) : Palette.ink.opacity(0.6)
    }
}

extension DayEntry {
    var state: DayState {
        let minute = DaySnapshot.minutes(of: date)
        guard !blocked, let snap = snapshot, snap.isFresh(for: date) else {
            return DayState(
                snapshot: nil, current: nil, next: [], minute: minute,
                tone: .night, mood: .sleep, fresh: false, blocked: blocked
            )
        }

        let current = snap.current(at: minute)
        let justMissed = snap.blocks.contains { $0.isMissed && $0.to <= minute && minute - $0.to < 90 }
        let tone: DayTone
        if justMissed {
            tone = .alarm
        } else if current == nil && snap.upcoming(at: minute, limit: 1).isEmpty {
            tone = .night
        } else {
            tone = .day
        }

        return DayState(
            snapshot: snap,
            current: current,
            next: snap.upcoming(at: minute, limit: 3),
            minute: minute,
            tone: tone,
            mood: PetMood(raw: snap.mood),
            fresh: true,
            blocked: false
        )
    }
}
