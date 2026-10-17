import WidgetKit
import SwiftUI

struct DayWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: DayEntry

    var body: some View {
        let state = entry.state

        if state.blocked {
            Notice(text: "Виджет не видит данных. Включите App Groups в Xcode или впишите ключ в Secrets.swift — тогда день придёт с сервера.")
        } else if !state.fresh {
            Notice(text: "Откройте Kamron APP — виджет возьмёт сегодняшний день.")
        } else if family == .systemSmall {
            SmallView(state: state, pose: entry.pose, now: entry.date)
        } else {
            MediumView(state: state, pose: entry.pose, now: entry.date)
        }
    }
}

// MARK: - Маленький

private struct SmallView: View {
    let state: DayState
    let pose: PetPose
    let now: Date

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack {
                PetFace(mood: state.mood, pose: pose, skin: state.skin, size: 34)
                Spacer()
                Text(now, style: .time)
                    .font(.system(size: 12, weight: .bold))
                    .foregroundStyle(state.dimColor)
            }

            Spacer(minLength: 6)

            if let block = state.current {
                Text(block.icon + " " + "сейчас")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(state.dimColor)
                Text(block.title)
                    .font(.system(size: 19, weight: .heavy))
                    .foregroundStyle(state.textColor)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)

                Left(end: DaySnapshot.moment(block.to), color: state.dimColor)
                    .padding(.top, 2)

                ProgressView(
                    timerInterval: DaySnapshot.moment(block.from)...DaySnapshot.moment(block.to),
                    countsDown: false
                ) { EmptyView() } currentValueLabel: { EmptyView() }
                    .progressViewStyle(.linear)
                    .tint(state.textColor)
                    .labelsHidden()
                    .padding(.top, 6)
            } else if let soon = state.next.first {
                Text("дальше")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(state.dimColor)
                Text(soon.icon + " " + soon.title)
                    .font(.system(size: 18, weight: .heavy))
                    .foregroundStyle(state.textColor)
                    .lineLimit(2)
                    .minimumScaleFactor(0.7)
                Text(clock(soon.from))
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(state.dimColor)
                    .padding(.top, 2)
            } else {
                Text("день закрыт")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(state.dimColor)
                Text("\(state.snapshot?.pct ?? 0)%")
                    .font(.system(size: 30, weight: .heavy))
                    .foregroundStyle(state.textColor)
            }
        }
    }
}

// MARK: - Средний

private struct MediumView: View {
    let state: DayState
    let pose: PetPose
    let now: Date

    var body: some View {
        HStack(alignment: .top, spacing: 14) {
            VStack(alignment: .leading, spacing: 0) {
                HStack(spacing: 8) {
                    PetFace(mood: state.mood, pose: pose, skin: state.skin, size: 30)
                    Text(now, style: .time)
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(state.dimColor)
                }

                Spacer(minLength: 8)

                if let block = state.current {
                    Text(block.title)
                        .font(.system(size: 21, weight: .heavy))
                        .foregroundStyle(state.textColor)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                    Text("\(clock(block.from)) — \(clock(block.to))")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(state.dimColor)

                    Spacer(minLength: 6)

                    Left(end: DaySnapshot.moment(block.to), color: state.textColor, big: true)

                    if #available(iOS 17.0, *), !block.isDone {
                        Button(intent: MarkDoneIntent(
                            blockID: block.id,
                            dateKey: state.snapshot?.dateKey ?? ""
                        )) {
                            Text("Сделал")
                                .font(.system(size: 12, weight: .heavy))
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(state.tone == .night ? Palette.lime : Palette.ink)
                        .padding(.top, 6)
                    }
                } else {
                    Text(state.next.isEmpty ? "день закрыт" : "перерыв")
                        .font(.system(size: 19, weight: .heavy))
                        .foregroundStyle(state.textColor)
                    Text("сделано \(state.snapshot?.pct ?? 0)%")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(state.dimColor)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Divider().overlay(state.dimColor.opacity(0.4))

            VStack(alignment: .leading, spacing: 5) {
                Text("ДАЛЬШЕ")
                    .font(.system(size: 10, weight: .heavy))
                    .tracking(1.2)
                    .foregroundStyle(state.dimColor)

                ForEach(state.next.prefix(3)) { block in
                    HStack(spacing: 6) {
                        Text(clock(block.from))
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(state.dimColor)
                            .frame(width: 34, alignment: .leading)
                        Text(block.icon)
                            .font(.system(size: 11))
                        Text(block.title)
                            .font(.system(size: 12, weight: .bold))
                            .foregroundStyle(state.textColor)
                            .lineLimit(1)
                    }
                }

                if state.next.isEmpty {
                    Text("ничего не осталось")
                        .font(.system(size: 12, weight: .bold))
                        .foregroundStyle(state.dimColor)
                }

                Spacer(minLength: 0)

                HStack(spacing: 6) {
                    Tile(label: "день", value: "\(state.snapshot?.pct ?? 0)%", state: state)
                    Tile(label: "мимо", value: "\(state.snapshot?.missed ?? 0)", state: state)
                }
            }
            .frame(width: 150)
        }
    }
}

// MARK: - Мелочи

/// Живой остаток: секунды считает система, виджет для этого не будится.
private struct Left: View {
    let end: Date
    var color: Color
    var big: Bool = false

    var body: some View {
        HStack(spacing: 4) {
            Text(timerInterval: DaySnapshot.countdown(to: end), countsDown: true)
                .font(.system(size: big ? 26 : 15, weight: .heavy))
                .monospacedDigit()
                .foregroundStyle(color)
            Text("осталось")
                .font(.system(size: big ? 12 : 11, weight: .bold))
                .foregroundStyle(color.opacity(0.7))
        }
    }
}

private struct Tile: View {
    let label: String
    let value: String
    let state: DayState

    var body: some View {
        VStack(alignment: .leading, spacing: 1) {
            Text(label)
                .font(.system(size: 9, weight: .heavy))
                .foregroundStyle(state.dimColor)
            Text(value)
                .font(.system(size: 14, weight: .heavy))
                .foregroundStyle(state.textColor)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 5)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 10, style: .continuous)
                .fill(state.textColor.opacity(0.1))
        )
    }
}

private struct Notice: View {
    let text: String

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            PetFace(mood: .sleep, pose: .still, skin: Palette.lime, size: 30)
            Text(text)
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(.white.opacity(0.75))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
    }
}

func clock(_ minute: Int) -> String {
    String(format: "%02d:%02d", minute / 60, minute % 60)
}
