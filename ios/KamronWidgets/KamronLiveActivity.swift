import ActivityKit
import WidgetKit
import SwiftUI

/// Живое уведомление: карточка на экране блокировки и Динамический остров.
@available(iOS 16.2, *)
struct KamronLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: KamronActivityAttributes.self) { context in
            LockScreenCard(state: context.state)
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

    /// Предмет занятия у питомца есть не всегда: значок вне таблицы
    /// (а «📌» — это дефолт для любой задачи без своего) даёт `.idle`, и
    /// питомец садится без ничего. Эмодзи рядом с названием в этом случае
    /// остаётся единственным намёком на то, что за дело, — тогда его и
    /// показываем. Когда предмет есть, эмодзи было бы тем же дважды.
    private var activity: PetActivity { PetActivity(icon: state.icon) }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 12) {
                VStack(alignment: .leading, spacing: 2) {
                    /* «ЗАКРЫТО» здесь и «Готово» ниже — одно и то же дважды,
                       ровно тот повтор, ради которого убрано эмодзи. Для
                       закрытого дела хватает нижней строки. */
                    if !state.done {
                        Text("СЕЙЧАС")
                            .font(.system(size: 10, weight: .heavy))
                            .tracking(1.4)
                            .foregroundStyle(.secondary)
                    }

                    HStack(spacing: 6) {
                        if activity.symbol == nil, !state.icon.isEmpty {
                            Text(state.icon)
                                .font(.system(size: 15))
                        }
                        Text(state.title)
                            .font(.system(size: 21, weight: .heavy))
                            .lineLimit(1)
                            .minimumScaleFactor(0.7)
                    }
                }

                Spacer(minLength: 6)

                PetScene(
                    mood: state.done ? .happy : PetMood(raw: state.mood),
                    pose: .still,
                    activity: activity,
                    skin: Palette.lime,
                    size: 42
                )
            }

            /* Остаток — главное число карточки: с экрана блокировки
               смотрят ради него, а не ради названия дела. */
            HStack(alignment: .firstTextBaseline, spacing: 8) {
                if state.done {
                    /* Отсчёт у закрытого дела показывать нечего: он бы
                       продолжал бежать к концу окна, которое уже не важно.
                       Размер тот же, что у числа, иначе карточка заметно
                       подпрыгивает в момент отметки. */
                    Text("Готово")
                        .font(.system(size: 30, weight: .heavy))
                        .foregroundStyle(Palette.lime)
                        .lineLimit(1)
                    Caption(time(state.startedAt) + " — " + time(state.endsAt))
                } else {
                    Remaining(end: state.endsAt, big: true, tint: Palette.lime, stacked: false)
                    Caption("осталось · до " + time(state.endsAt))
                }
                Spacer(minLength: 0)
            }

            /* У закрытого дела полоса заполнена и стоит. Живая продолжала бы
               ползти к концу окна — тот самый отсчёт, который убран выше,
               просто в другом виде. */
            if state.done {
                Bar(full: true)
            } else {
                Bar(from: state.startedAt, to: state.endsAt)
            }
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
        VStack(alignment: stacked ? .trailing : .leading, spacing: 2) {
            Group {
                if DaySnapshot.ticking(until: end) {
                    Text(timerInterval: DaySnapshot.countdown(to: end), countsDown: true)
                        /* Ширину запираем только в стопке: формат по дороге
                           меняется («1:29:59» → «29:59»), и без рамки соседний
                           текст прыгает. В строке карточки подпись стоит
                           вплотную справа, и рамка оставила бы между ними дыру. */
                        .frame(maxWidth: stacked ? (big ? 86 : 78) : nil,
                               alignment: stacked ? .trailing : .leading)
                } else {
                    /* Посчитанную строку здесь писать нельзя.

                       Своё «12 ч 26» считается один раз, в момент отрисовки, а
                       живое уведомление перерисовывается только когда
                       приложение успело прислать обновление — таймлайна, как у
                       виджета, у него нет. Для дела на шесть часов это значит,
                       что число застынет на «6 ч» до самого вечера и начнёт
                       спорить с собственной подписью «до 19:30».

                       Системный относительный текст система обновляет сама,
                       без нас, и на длинном остатке показывает часы с
                       минутами, а не секунды — ровно то, что нужно. */
                    Text(end, style: .relative)
                }
            }
            .font(.system(size: size, weight: .heavy))
            .monospacedDigit()
            .foregroundStyle(tint)
            .lineLimit(1)
            /* Сжиматься первой должна подпись, а не главное число: «1:29:59»,
               обрезанное до «1:29:…», хуже мелкой подписи рядом. */
            .minimumScaleFactor(0.75)
            .layoutPriority(1)

            if stacked {
                Text("осталось")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(.secondary)
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
                /* Тоже системный относительный текст, а не своя строка: в
                   острове она застывала бы ровно так же, как на карточке, и
                   висела бы перед глазами весь день. Ширину ограничиваем —
                   места здесь мало. */
                Text(end, style: .relative)
                    .frame(maxWidth: 58)
            }
        }
        .font(.system(size: 13, weight: .heavy))
        .monospacedDigit()
        .foregroundStyle(Palette.lime)
        .lineLimit(1)
        .minimumScaleFactor(0.7)
    }
}

/// Подпись рядом с главным числом.
private struct Caption: View {
    let text: String
    init(_ text: String) { self.text = text }

    var body: some View {
        Text(text)
            .font(.system(size: 12, weight: .bold))
            .foregroundStyle(.secondary)
            .lineLimit(1)
            .minimumScaleFactor(0.8)
    }
}

/// Полоса прогресса идёт сама: система двигает её без участия приложения.
private struct Bar: View {
    var from: Date = .distantPast
    var to: Date = .distantPast
    /// Заполненная и неподвижная — для закрытого дела.
    var full: Bool = false

    var body: some View {
        Group {
            if full {
                GeometryReader { geo in
                    Capsule().fill(Palette.lime).frame(width: geo.size.width)
                }
                .frame(height: 4)
            } else {
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
    }
}

func time(_ date: Date) -> String {
    let f = DateFormatter()
    f.locale = Locale(identifier: "ru_RU")
    f.dateFormat = "HH:mm"
    return f.string(from: date)
}
