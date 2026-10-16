import ActivityKit
import WidgetKit
import SwiftUI

/// Живое уведомление: карточка на экране блокировки и Динамический остров.
@available(iOS 16.2, *)
struct KamronLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: KamronActivityAttributes.self) { context in
            LockScreenCard(state: context.state, dateKey: context.attributes.dateKey)
                .activityBackgroundTint(Color.black.opacity(0.35))
                .activitySystemActionForegroundColor(Palette.lime)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    HStack(spacing: 8) {
                        PetFace(mood: PetMood(raw: context.state.mood), pose: .still, skin: Palette.lime, size: 32)
                        VStack(alignment: .leading, spacing: 1) {
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
                    VStack(alignment: .trailing, spacing: 1) {
                        Text(timerInterval: DaySnapshot.countdown(to: context.state.endsAt), countsDown: true)
                            .font(.system(size: 20, weight: .heavy))
                            .monospacedDigit()
                            .foregroundStyle(Palette.lime)
                            .frame(maxWidth: 74, alignment: .trailing)
                        Text("осталось")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(.secondary)
                    }
                }

                DynamicIslandExpandedRegion(.bottom) {
                    VStack(spacing: 10) {
                        ProgressView(
                            timerInterval: context.state.startedAt...context.state.endsAt,
                            countsDown: false
                        ) { EmptyView() } currentValueLabel: { EmptyView() }
                            .progressViewStyle(.linear)
                            .tint(Palette.lime)
                            .labelsHidden()

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
                PetFace(mood: PetMood(raw: context.state.mood), pose: .still, skin: Palette.lime, size: 22)
            } compactTrailing: {
                Text(timerInterval: DaySnapshot.countdown(to: context.state.endsAt), countsDown: true)
                    .font(.system(size: 13, weight: .heavy))
                    .monospacedDigit()
                    .foregroundStyle(Palette.lime)
                    .frame(maxWidth: 44)
            } minimal: {
                PetFace(mood: PetMood(raw: context.state.mood), pose: .still, skin: Palette.lime, size: 20)
            }
            .keylineTint(Palette.lime)
        }
    }
}

/// Карточка на экране блокировки.
@available(iOS 16.2, *)
private struct LockScreenCard: View {
    let state: KamronActivityAttributes.ContentState
    let dateKey: String

    var body: some View {
        HStack(spacing: 13) {
            PetFace(
                mood: state.done ? .happy : PetMood(raw: state.mood),
                pose: .still,
                skin: Palette.lime,
                size: 46
            )

            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 5) {
                    Text(state.icon)
                        .font(.system(size: 13))
                    Text(state.title)
                        .font(.system(size: 17, weight: .heavy))
                        .lineLimit(1)
                }
                Text(state.done ? "закрыто" : "до " + time(state.endsAt))
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(.secondary)

                ProgressView(
                    timerInterval: state.startedAt...state.endsAt,
                    countsDown: false
                ) { EmptyView() } currentValueLabel: { EmptyView() }
                    .progressViewStyle(.linear)
                    .tint(Palette.lime)
                    .labelsHidden()
                    .padding(.top, 3)
            }

            VStack(spacing: 1) {
                Text(timerInterval: DaySnapshot.countdown(to: state.endsAt), countsDown: true)
                    .font(.system(size: 17, weight: .heavy))
                    .monospacedDigit()
                    .foregroundStyle(Palette.lime)
                    .frame(width: 62)
                Text("осталось")
                    .font(.system(size: 9, weight: .bold))
                    .foregroundStyle(.secondary)
            }
        }
        .padding(14)
    }
}

func time(_ date: Date) -> String {
    let f = DateFormatter()
    f.locale = Locale(identifier: "ru_RU")
    f.dateFormat = "HH:mm"
    return f.string(from: date)
}
