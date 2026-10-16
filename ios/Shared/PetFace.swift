import SwiftUI

/// Настроения питомца в том объёме, который виджет способен показать.
enum PetMood: String {
    case calm, focus, happy, worry, angry, sleep

    init(raw: String) { self = PetMood(rawValue: raw) ?? .calm }
}

/// Поза — это кадр. Виджет не умеет крутить бесконечную анимацию, поэтому
/// движение собрано из заранее отрисованных кадров: таймлайн подставляет
/// их по одному в минуту, и питомец выглядит живым, а не замороженным.
enum PetPose: Int, CaseIterable {
    case still, glance, blink, grin, tilt

    /// Моргание нарочно редкое: если ставить его через кадр, питомец
    /// выглядит нервным, а не живым.
    static let cycle: [PetPose] = [
        .still, .glance, .still, .blink, .still, .grin,
        .still, .tilt, .still, .glance, .still, .blink
    ]

    static func at(_ step: Int) -> PetPose {
        let n = cycle.count
        return cycle[((step % n) + n) % n]
    }
}

/// Тот же питомец, что на главной странице: скруглённый ромб с лицом.
struct PetFace: View {
    var mood: PetMood = .calm
    var pose: PetPose = .still
    /// Цвет тела. Лицо всегда тёмное — так оно читается на любом теле.
    var skin: Color = .white
    var size: CGFloat = 44

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: size * 0.21, style: .continuous)
                .fill(skin)
                .frame(width: size * 0.68, height: size * 0.68)
                .rotationEffect(.degrees(45))

            face
        }
        .frame(width: size, height: size)
        .rotationEffect(.degrees(pose == .tilt ? 7 : 0))
        .animation(.spring(response: 0.5, dampingFraction: 0.72), value: pose)
        .animation(.spring(response: 0.5, dampingFraction: 0.72), value: mood)
    }

    // MARK: - Лицо

    private var face: some View {
        VStack(spacing: size * 0.09) {
            HStack(spacing: size * 0.20) {
                eye
                eye
            }
            .overlay(alignment: .top) { brows }
            mouth
        }
        .offset(x: pose == .glance ? -size * 0.03 : 0, y: mood == .sleep ? size * 0.02 : 0)
    }

    private var eye: some View {
        Group {
            if closedEyes {
                Capsule()
                    .fill(Palette.ink)
                    .frame(width: size * 0.13, height: size * 0.045)
            } else {
                Circle()
                    .fill(Palette.ink)
                    .frame(width: size * 0.105, height: size * 0.105)
            }
        }
    }

    private var closedEyes: Bool {
        pose == .blink || mood == .sleep
    }

    /// Брови только у злого: в остальных настроениях они съедают глаза.
    @ViewBuilder private var brows: some View {
        if mood == .angry {
            HStack(spacing: size * 0.16) {
                Capsule()
                    .fill(Palette.ink)
                    .frame(width: size * 0.17, height: size * 0.045)
                    .rotationEffect(.degrees(18))
                Capsule()
                    .fill(Palette.ink)
                    .frame(width: size * 0.17, height: size * 0.045)
                    .rotationEffect(.degrees(-18))
            }
            .offset(y: -size * 0.10)
        }
    }

    private var mouth: some View {
        Mouth(curve: curve)
            .stroke(Palette.ink, style: StrokeStyle(lineWidth: size * 0.055, lineCap: .round))
            .frame(width: size * 0.26, height: size * 0.10)
    }

    /// От −1 (уголки вниз) до 1 (улыбка). Ноль — ровная черта.
    private var curve: CGFloat {
        switch mood {
        case .happy: return pose == .grin ? 1.0 : 0.8
        case .calm: return pose == .grin ? 0.7 : 0.25
        case .focus: return pose == .grin ? 0.4 : 0
        case .worry: return -0.45
        case .angry: return -0.8
        case .sleep: return 0.3
        }
    }
}

/// Рот одной кривой: так настроение меняется плавно, без подмены картинок.
private struct Mouth: Shape {
    var curve: CGFloat

    var animatableData: CGFloat {
        get { curve }
        set { curve = newValue }
    }

    func path(in rect: CGRect) -> Path {
        var path = Path()
        let mid = rect.midY
        path.move(to: CGPoint(x: rect.minX, y: mid))
        path.addQuadCurve(
            to: CGPoint(x: rect.maxX, y: mid),
            control: CGPoint(x: rect.midX, y: mid + curve * rect.height)
        )
        return path
    }
}
