import Foundation

enum Config {
    /// Адрес опубликованного приложения.
    static let appURL = URL(string: "https://kslmvv.github.io/kamron-app/")!

    /// Переходы внутри приложения разрешены только по этому узлу.
    /// Всё остальное — внешние ссылки, они открываются в Safari: чужая
    /// страница внутри приложения выглядит как часть приложения, а это
    /// ровно то, на чём строят поддельные формы входа.
    static let allowedHost = "kslmvv.github.io"
}
