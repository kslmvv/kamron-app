import SwiftUI

/// Чем человек занят прямо сейчас.
///
/// Сцен из приложения в виджете быть не может: WidgetKit не исполняет ни
/// JavaScript, ни CSS — он показывает заранее отрисованные кадры. Поэтому
/// занятие здесь не анимация, а предмет рядом с питомцем: ноутбук, книга,
/// кружка. Движение даёт таймлайн, подставляя кадр раз в минуту.
enum PetActivity {
    case work, read, write, present, health, shower, eat, drink
    case travel, flight, sport, ball, screen, game, music
    case sleep, wake, call, meeting, shop, gift, money, family
    case clean, laundry, repair, haircut, pray, photo, walk, idle

    /// Значок дела приходит в снимке тем же, что страница показывает в
    /// списке, поэтому разбор один на оба конца.
    ///
    /// Таблица повторяет SCENE_BY_ICON в app.js и собрана из неё, чтобы
    /// эмодзи совпали посимвольно: у половины из них есть невидимый
    /// селектор начертания, и «☕️» вручную легко набрать как «☕».
    ///
    /// Второго уровня — SCENE_BY_KIND по типу блока — здесь нет: виджету
    /// не присылают тип. Пока это безвредно, все значки из buildDay в
    /// таблице есть. Появится режимный блок со значком вне её — страница
    /// и виджет молча разойдутся.
    init(icon: String) {
        switch icon {
        case "⚽️": self = .ball
        case "📞": self = .call
        case "🧹": self = .clean
        case "☕️", "💧": self = .drink
        case "🍽️", "🍲": self = .eat
        case "👨‍👩‍👦": self = .family
        case "✈️": self = .flight
        case "🎮": self = .game
        case "🎁": self = .gift
        case "💈": self = .haircut
        case "🩺": self = .health
        case "🧺": self = .laundry
        case "🤝": self = .meeting
        case "💳": self = .money
        case "🎧": self = .music
        case "📷": self = .photo
        case "🕌": self = .pray
        case "📊": self = .present
        case "📖", "📚", "🎓": self = .read
        case "🔧": self = .repair
        case "🎬": self = .screen
        case "🛒": self = .shop
        case "🚿": self = .shower
        case "😴", "🌙": self = .sleep
        case "🏋️": self = .sport
        case "🚌", "🚗": self = .travel
        case "🌅": self = .wake
        case "🌳", "🌿", "✨": self = .walk
        case "💻": self = .work
        case "📝", "✉️": self = .write
        default: self = .idle
        }
    }

    /// Предмет занятия — системным значком.
    ///
    /// Рисовать каждый предмет вручную на сорока пунктах бессмысленно:
    /// системные значки читаются на любом размере, выглядят на айфоне
    /// своими и не ломаются на экране блокировки, где цвет отбирают.
    var symbol: String? {
        switch self {
        case .work: return "laptopcomputer"
        case .read: return "book.fill"
        case .write: return "pencil"
        case .present: return "chart.bar.fill"
        case .health: return "heart.fill"
        case .shower: return "shower.fill"
        case .eat: return "fork.knife"
        case .drink: return "mug.fill"
        case .travel: return "bus.fill"
        case .flight: return "airplane"
        case .sport: return "dumbbell.fill"
        case .ball: return "soccerball"
        case .screen: return "tv.fill"
        case .game: return "gamecontroller.fill"
        case .music: return "headphones"
        case .sleep: return "moon.zzz.fill"
        case .wake: return "sunrise.fill"
        case .call: return "phone.fill"
        case .meeting: return "bubble.left.and.bubble.right.fill"
        case .shop: return "cart.fill"
        case .gift: return "gift.fill"
        case .money: return "creditcard.fill"
        case .family: return "person.2.fill"
        case .clean: return "sparkles"
        case .laundry: return "washer.fill"
        case .repair: return "wrench.fill"
        case .haircut: return "scissors"
        case .pray: return "figure.mind.and.body"
        case .photo: return "camera.fill"
        case .walk: return "figure.walk"
        case .idle: return nil
        }
    }

    /// Занятия, в которых питомец не ёрзает: спит или молится.
    var isCalm: Bool { self == .sleep || self == .pray }
}

/// Питомец с предметом занятия.
///
/// Предмет висит в кружке у нижнего угла, как значок на иконке
/// приложения: он не лезет на лицо и читается даже на тридцати пунктах.
struct PetScene: View {
    var mood: PetMood = .calm
    var pose: PetPose = .still
    var activity: PetActivity = .idle
    /// Основной цвет тела — тот же, что у PetFace.
    var skin: Color = .white
    var size: CGFloat = 40

    var body: some View {
        ZStack(alignment: .bottomTrailing) {
            PetFace(mood: mood, pose: shownPose, skin: skin, size: size)
            if let symbol = activity.symbol {
                prop(symbol)
            }
        }
        // Лишнюю ширину занимаем только когда предмет есть: иначе
        // соседний текст съезжает вправо без всякой причины.
        .frame(width: size * (activity.symbol == nil ? 1 : 1.22), height: size, alignment: .leading)
    }

    /// Спящий питомец не моргает и не вертит головой — поза замирает.
    private var shownPose: PetPose {
        activity.isCalm ? .still : pose
    }

    private func prop(_ symbol: String) -> some View {
        let box = size * 0.46
        // Кружок красим телом питомца, а не лаймом: днём фон виджета сам
        // лаймовый, и лайм на лайме пропадает — остаётся висеть в воздухе
        // один тёмный значок.
        return Image(systemName: symbol)
            .font(.system(size: box * 0.72, weight: .bold))
            .foregroundStyle(Palette.ink)
            .frame(width: box, height: box)
            .background(Circle().fill(skin))
            .offset(x: size * 0.2, y: lift)
    }

    /// Предмет чуть качается вместе с питомцем: кадры таймлайна идут раз
    /// в минуту, и без этого сдвига соседние минуты неотличимы.
    /// Только вверх: кружок стоит нижней кромкой на границе рамки, и
    /// сдвиг вниз вылезает на то, что нарисовано следом.
    private var lift: CGFloat {
        switch shownPose {
        case .glance: return -size * 0.02
        case .grin: return -size * 0.05
        case .tilt: return -size * 0.03
        default: return 0
        }
    }
}
