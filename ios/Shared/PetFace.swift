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

/// Питомец: скруглённый ромб с лицом, как на главной странице.
///
/// Рисуется объёмным нарочно. На иконке размером с ноготь плоское пятно
/// с двумя точками читается как значок, а не как живое существо, — а весь
/// смысл питомца в том, что на него смотрят как на кого-то.
struct PetFace: View {
    var mood: PetMood = .calm
    var pose: PetPose = .still
    /// Основной цвет тела. Лицо всегда тёмное — так оно читается на любом.
    var skin: Color = .white
    var size: CGFloat = 44

    var body: some View {
        ZStack {
            shadow
            crest
            bodyShape
            gloss
            face
        }
        .frame(width: size, height: size)
        .rotationEffect(.degrees(pose == .tilt ? 6 : 0))
        .animation(.spring(response: 0.5, dampingFraction: 0.72), value: pose)
        .animation(.spring(response: 0.5, dampingFraction: 0.72), value: mood)
    }

    // MARK: - Тело

    /// Тень отрывает питомца от фона: без неё он выглядит наклейкой.
    private var shadow: some View {
        Ellipse()
            .fill(Color.black.opacity(0.18))
            .frame(width: size * 0.46, height: size * 0.10)
            .offset(y: size * 0.40)
            .blur(radius: size * 0.04)
    }

    private var bodyShape: some View {
        RoundedRectangle(cornerRadius: size * 0.21, style: .continuous)
            .fill(
                LinearGradient(
                    colors: [skin, skin.opacity(0.82)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
            )
            .frame(width: size * 0.70, height: size * 0.70)
            .rotationEffect(.degrees(45))
            .shadow(color: .black.opacity(0.10), radius: size * 0.03, y: size * 0.015)
    }

    /// Блик сверху слева — та же стеклянная подсветка, что в приложении.
    private var gloss: some View {
        Ellipse()
            .fill(
                LinearGradient(
                    colors: [.white.opacity(0.65), .white.opacity(0)],
                    startPoint: .top,
                    endPoint: .bottom
                )
            )
            .frame(width: size * 0.30, height: size * 0.17)
            .rotationEffect(.degrees(-28))
            .offset(x: -size * 0.11, y: -size * 0.21)
            .blendMode(.plusLighter)
    }

    /// Хохолок: три луча над головой. Он же показывает настроение —
    /// подбирается, когда питомец доволен, и вянет, когда недоволен.
    private var crest: some View {
        Image(systemName: "sparkle")
            .font(.system(size: size * 0.17, weight: .black))
            .foregroundStyle(crestColor)
            .rotationEffect(.degrees(mood == .worry || mood == .angry ? 22 : -8))
            .offset(x: size * 0.19, y: -size * 0.34)
            .opacity(mood == .sleep ? 0 : 1)
    }

    private var crestColor: Color {
        switch mood {
        case .angry, .worry: return Palette.miss
        case .happy: return Palette.lime
        default: return skin == .white ? Palette.limeDeep : .white.opacity(0.75)
        }
    }

    // MARK: - Лицо

    private var face: some View {
        VStack(spacing: size * 0.075) {
            ZStack {
                HStack(spacing: size * 0.17) {
                    eye
                    eye
                }
                brows
            }
            mouth
        }
        .offset(x: pose == .glance ? -size * 0.035 : 0, y: size * 0.02)
        .overlay(cheeks)
    }

    private var eye: some View {
        Group {
            if closedEyes {
                Capsule()
                    .fill(Palette.ink)
                    .frame(width: size * 0.15, height: size * 0.05)
            } else {
                ZStack(alignment: .topTrailing) {
                    Capsule()
                        .fill(Palette.ink)
                        .frame(width: size * 0.125, height: size * 0.155)
                    // Блик в зрачке: он один превращает точку во взгляд.
                    Circle()
                        .fill(.white.opacity(0.95))
                        .frame(width: size * 0.045, height: size * 0.045)
                        .offset(x: -size * 0.018, y: size * 0.028)
                }
                .frame(width: size * 0.125, height: size * 0.155)
            }
        }
    }

    private var closedEyes: Bool { pose == .blink || mood == .sleep }

    /// Брови только у злого и встревоженного: в остальных настроениях
    /// они съедают глаза и лицо становится хмурым без причины.
    @ViewBuilder private var brows: some View {
        if mood == .angry || mood == .worry {
            let angle: Double = mood == .angry ? 20 : 10
            HStack(spacing: size * 0.13) {
                Capsule()
                    .fill(Palette.ink)
                    .frame(width: size * 0.19, height: size * 0.05)
                    .rotationEffect(.degrees(angle))
                Capsule()
                    .fill(Palette.ink)
                    .frame(width: size * 0.19, height: size * 0.05)
                    .rotationEffect(.degrees(-angle))
            }
            .offset(y: -size * 0.155)
        }
    }

    /// Щёки появляются только когда радость настоящая — иначе улыбка
    /// выглядит дежурной.
    @ViewBuilder private var cheeks: some View {
        if mood == .happy {
            HStack(spacing: size * 0.33) {
                blush
                blush
            }
            .offset(y: size * 0.06)
        }
    }

    private var blush: some View {
        Ellipse()
            .fill(Palette.miss.opacity(0.28))
            .frame(width: size * 0.12, height: size * 0.07)
            .blur(radius: size * 0.012)
    }

    private var mouth: some View {
        Group {
            if mood == .happy && pose == .grin {
                // Открытый рот: самая сильная из доступных эмоций.
                Mouth(curve: 1)
                    .fill(Palette.ink)
                    .frame(width: size * 0.26, height: size * 0.14)
            } else {
                Mouth(curve: curve)
                    .stroke(Palette.ink, style: StrokeStyle(lineWidth: size * 0.058, lineCap: .round))
                    .frame(width: size * 0.26, height: size * 0.10)
            }
        }
    }

    /// От −1 (уголки вниз) до 1 (улыбка). Ноль — ровная черта.
    private var curve: CGFloat {
        switch mood {
        case .happy: return 0.85
        case .calm: return pose == .grin ? 0.7 : 0.3
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
