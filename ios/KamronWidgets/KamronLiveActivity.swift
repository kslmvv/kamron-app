import ActivityKit
import WidgetKit
import SwiftUI

/// Живое уведомление: карточка на экране блокировки и Динамический остров.
@available(iOS 16.2, *)
struct KamronLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: KamronActivityAttributes.self) { context in
            LockScreenCard(state: context.state, dateKey: context.attributes.dateKey)
                .activityBackgroundTint(Palette.liveBack.opacity(0.92))
                .activitySystemActionForegroundColor(Palette.lime)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 9) {
                        PetScene(
                            mood: PetMood(raw: context.state.mood),
                            pose: .still,
                            activity: PetActivity(icon: context.state.icon),
                            skin: Palette.lime,
                            size: 36
                        )
                        VStack(alignment: .leading, spacing: 2) {
                            Text(context.state.title)
                                .font(.system(size: 15, weight: .heavy))
                                .lineLimit(1)
                            Text("до " + time(context.state.endsAt))
                                .font(.system(size: 11, weight: .bold))
                                .foregroundStyle(.secondary)
                        }
                    }
                }

                DynamicIslandExpandedRegion(.trailing) {
                    Remaining(end: context.state.endsAt, big: true, tint: Palette.lime)
                }

                DynamicIslandExpandedRegion(.bottom) {
                    VStack(spacing: 10) {
                        Bar(from: context.state.startedAt, to: context.state.endsAt)

                        if #available(iOS 17.0, *), !context.state.done {
                            Button(intent: MarkDoneIntent(
                                blockID: context.state.blockID,
                                dateKey: context.attributes.dateKey
                            )) {
                                Text("Сделал")
                                    .font(.system(size: 14, weight: .heavy))
                                    .frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.borderedProminent)
                            .tint(Palette.lime)
                        }
                    }
                }
            } compactLeading: {
                PetFace(mood: PetMood(raw: context.state.mood), pose: .still, skin: Palette.lime, size: 24)
            } compactTrailing: {
                CompactRemaining(end: context.state.endsAt)
            } minimal: {
                PetFace(mood: PetMood(raw: context.state.mood), pose: .still, skin: Palette.lime, size: 22)
            }
            .keylineTint(Palette.lime)
        }
    }
}

// MARK: - Карточка на экране блокировки

@available(iOS 16.2, *)
private struct LockScreenCard: View {
    let state: KamronActivityAttributes.ContentState
    let dateKey: String

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 12) {
                VStack(alignment: .leading, spacing: 2) {
                    Text(state.done ? "ЗАКРЫТО" : "СЕЙЧАС")
                        .font(.system(size: 10, weight: .heavy))
                        .tracking(1.4)
                        .foregroundStyle(.white.opacity(0.42))

                    /* Значок занятия питомец показывает предметом, поэтому
                       эмодзи рядом с названием — то же самое дважды. */
                    Text(state.title)
                        .font(.system(size: 21, weight: .heavy))
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                }

                Spacer(minLength: 6)

                PetScene(
                    mood: state.done ? .happy : PetMood(raw: state.mood),
                    pose: .still,
                    activity: PetActivity(icon: state.icon),
                    skin: Palette.lime,
                    size: 42
                )
            }

            /* Остаток — главное число карточки: с экрана блокировки
               смотрят ради него, а не ради названия дела. */
            HStack(alignment: .firstTextBaseline, spacing: 8) {
                if state.done {
                    /* Отсчёт у закрытого дела показывать нечего: он бы
                       продолжал бежать к концу окна, которое уже не важно. */
                    Text("Готово")
                        .font(.system(size: 26, weight: .heavy))
                        .foregroundStyle(Palette.lime)
                    Text(time(state.startedAt) + " — " + time(state.endsAt))
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(.white.opacity(0.45))
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                } else {
                    Remaining(end: state.endsAt, big: true, tint: Palette.lime, stacked: false)
                    Text("осталось · до " + time(state.endsAt))
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(.white.opacity(0.45))
                        .lineLimit(1)
                        .minimumScaleFactor(0.8)
                }
                Spacer(minLength: 0)
            }

            Bar(from: state.startedAt, to: state.endsAt)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
    }
}

// MARK: - Общие части

/// Остаток времени.
///
/// Секунды показываем только у короткого дела. Бегущие 12:26:13 до конца
/// выходного — мелькание без смысла: там важен сам факт «ещё полдня».
private struct Remaining: View {
    let end: Date
    var big: Bool
    var tint: Color
    /// Со своей подписью «осталось» снизу — так нужно в Динамическом
    /// острове, где рядом места нет. На карточке подпись стоит сбоку, и
    /// вторая была бы повтором.
    var stacked: Bool = true

    private var size: CGFloat { big ? (stacked ? 22 : 30) : 19 }

    var body: some View {
        VStack(alignment: .trailing, spacing: 2) {
            if DaySnapshot.ticking(until: end) {
                Text(timerInterval: DaySnapshot.countdown(to: end), countsDown: true)
                    .font(.system(size: size, weight: .heavy))
                    .monospacedDigit()
                    .foregroundStyle(tint)
                    /* Ширину запираем только в стопке: бегущие цифры разной
                       ширины иначе дёргают соседей. В строке карточки текст
                       стоит справа от числа, и фиксированная рамка оставила
                       бы между ними дыру. */
                    .frame(maxWidth: stacked ? (big ? 86 : 78) : nil, alignment: .trailing)
            } else {
                Text(DaySnapshot.rough(until: end))
                    .font(.system(size: big ? (stacked ? 20 : 30) : 17, weight: .heavy))
                    .monospacedDigit()
                    .foregroundStyle(tint)
                    .lineLimit(1)
            }
            if stacked {
                Text("осталось")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(.white.opacity(0.45))
            }
        }
    }
}

/// В свёрнутом острове места на «12 ч 26» нет — только самое крупное.
private struct CompactRemaining: View {
    let end: Date

    var body: some View {
        Group {
            if DaySnapshot.ticking(until: end) {
                Text(timerInterval: DaySnapshot.countdown(to: end), countsDown: true)
                    .frame(maxWidth: 44)
            } else {
                Text(DaySnapshot.rough(until: end).replacingOccurrences(of: " мин", with: "м"))
            }
        }
        .font(.system(size: 13, weight: .heavy))
        .monospacedDigit()
        .foregroundStyle(Palette.lime)
    }
}

/// Полоса прогресса идёт сама: система двигает её без участия приложения.
private struct Bar: View {
    let from: Date
    let to: Date

    var body: some View {
        ProgressView(timerInterval: from...max(to, from.addingTimeInterval(60)), countsDown: false) {
            EmptyView()
        } currentValueLabel: {
            EmptyView()
        }
        .progressViewStyle(.linear)
        .tint(Palette.lime)
        .labelsHidden()
        .scaleEffect(x: 1, y: 0.7, anchor: .center)
    }
}

func time(_ date: Date) -> String {
    let f = DateFormatter()
    f.locale = Locale(identifier: "ru_RU")
    f.dateFormat = "HH:mm"
    return f.string(from: date)
}
