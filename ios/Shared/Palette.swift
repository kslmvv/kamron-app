import SwiftUI

/// Цвета те же, что в приложении: виджет не должен выглядеть соседом.
enum Palette {
    static let lime = Color(red: 0.839, green: 0.949, blue: 0.294)      // #D6F24B
    static let limeDeep = Color(red: 0.667, green: 0.812, blue: 0.141)  // #AACF24
    static let ink = Color(red: 0.082, green: 0.094, blue: 0.075)       // #151813
    static let miss = Color(red: 0.957, green: 0.376, blue: 0.298)      // #F4604C
    static let missSoft = Color(red: 1.0, green: 0.541, blue: 0.478)    // #FF8A7A

    /// Фон иконки и тёмных состояний — ночной с зелёным подтоном.
    static let night = LinearGradient(
        colors: [
            Color(red: 0.141, green: 0.180, blue: 0.114),
            Color(red: 0.082, green: 0.102, blue: 0.063),
            Color(red: 0.043, green: 0.051, blue: 0.031)
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let day = LinearGradient(
        colors: [
            Color(red: 0.914, green: 0.988, blue: 0.510),
            Color(red: 0.776, green: 0.894, blue: 0.235)
        ],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )

    static let alarm = LinearGradient(
        colors: [Color(red: 1.0, green: 0.541, blue: 0.478), Color(red: 0.957, green: 0.376, blue: 0.298)],
        startPoint: .topLeading,
        endPoint: .bottomTrailing
    )
}
