//
//  Образец. Скопируйте рядом под именем Secrets.swift и впишите своё.
//  Secrets.swift в репозиторий не попадает — он перечислен в .gitignore.
//
//      cp Shared/Secrets.example.swift Shared/Secrets.swift
//
//  Нужен только если виджет берёт день с сервера — то есть когда Apple
//  не дала App Group. С общим ящиком оставьте строки пустыми.
//
enum Secrets {
    /// Адрес сервера Jarvis, без косой черты в конце.
    static let server = ""

    /// Значение WIDGET_TOKEN из переменных Railway. Отдельный ключ:
    /// он открывает только сегодняшний день и приём отметки.
    static let widgetToken = ""
}
