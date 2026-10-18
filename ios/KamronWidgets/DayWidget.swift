import WidgetKit
import SwiftUI

// MARK: - Кадр таймлайна

struct DayEntry: TimelineEntry {
    let date: Date
    let snapshot: DaySnapshot?
    let pose: PetPose
    /// Пути к данным нет вовсе — об этом надо сказать прямо, а не рисовать пустоту.
    let blocked: Bool
}

// MARK: - Поставщик кадров

struct DayProvider: TimelineProvider {
    /// День приходит одним из двух путей. Общий ящик лучше: данные не
    /// выходят в сеть и виджет работает офлайн. Если Apple его не дала,
    /// берём день с сервера — страница кладёт его туда сама.
    private var homeless: Bool { !Store.shared && !WidgetFeed.isConfigured }

    func placeholder(in context: Context) -> DayEntry {
        DayEntry(date: Date(), snapshot: .sample, pose: .still, blocked: false)
    }

    func getSnapshot(in context: Context, completion: @escaping (DayEntry) -> Void) {
        if context.isPreview {
            completion(DayEntry(date: Date(), snapshot: .sample, pose: .still, blocked: false))
            return
        }
        completion(DayEntry(date: Date(), snapshot: Store.snapshot(), pose: .still, blocked: homeless))
    }

    /// Кадры на час вперёд, по одному в минуту.
    ///
    /// Они отрисованы заранее, поэтому не тратят лимит обновлений: система
    /// показывает готовые кадры сама. Через час виджет попросит следующую
    /// порцию — к этому времени и данные успеют обновиться.
    func getTimeline(in context: Context, completion: @escaping (Timeline<DayEntry>) -> Void) {
        let local = Store.snapshot()

        // В сеть идём не только когда общего ящика нет, но и когда в нём
        // лежит вчерашний день: пустой виджет с надписью «откройте
        // приложение» бесполезен, если день можно просто забрать.
        let needFetch = WidgetFeed.isConfigured && (local == nil || !local!.isFresh())
        guard needFetch else {
            completion(hour(with: local))
            return
        }
        Task {
            let fetched = await WidgetFeed.day()
            completion(hour(with: fetched ?? local))
        }
    }

    private func hour(with snapshot: DaySnapshot?) -> Timeline<DayEntry> {
        let now = Date()
        let start = Calendar.current.date(bySetting: .second, value: 0, of: now) ?? now
        var entries: [DayEntry] = []
        for step in 0..<60 {
            entries.append(
                DayEntry(
                    date: start.addingTimeInterval(TimeInterval(step * 60)),
                    snapshot: snapshot,
                    pose: PetPose.at(step),
                    blocked: homeless
                )
            )
        }
        return Timeline(entries: entries, policy: .atEnd)
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

    /// Чем питомец занят: по значку текущего дела, а без дела — по
    /// настроению, которое посчитала страница.
    ///
    /// По тону решать нельзя: `.night` ставится не ночью, а когда дел
    /// больше не осталось, и его перебивает `.alarm` на полтора часа
    /// после любого упущенного блока. В три ночи тон был бы `.day`, и
    /// спящий питомец остался бы без луны.
    var activity: PetActivity {
        if let icon = current?.icon, !icon.isEmpty {
            return PetActivity(icon: icon)
        }
        return mood == .sleep ? .sleep : .idle
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
