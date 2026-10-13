//
//  Обёртка Kamron APP для iPhone.
//
//  Само приложение — веб-страница, опубликованная на GitHub Pages. Здесь
//  только оболочка: окно, иконка на домашнем экране и постоянное хранилище.
//  Логика и данные живут в самой странице, поэтому обновление приложения
//  не требует новой сборки — достаточно задеплоить страницу.
//
import SwiftUI

@main
struct KamronAPPApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
                // Страница сама учитывает безопасные области через
                // env(safe-area-inset-*), поэтому отдаём ей всё окно целиком.
                .ignoresSafeArea()
                .background(Color("LaunchBackground"))
        }
    }
}
