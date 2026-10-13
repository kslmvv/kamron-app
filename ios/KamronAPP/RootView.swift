import SwiftUI

struct RootView: View {
    @StateObject private var model = WebViewModel()

    var body: some View {
        ZStack {
            WebView(model: model)
                .opacity(model.failed ? 0 : 1)

            if model.failed {
                OfflineView(message: model.failureMessage) {
                    model.reload()
                }
            }
        }
    }
}

/// Экран на случай, когда страница не загрузилась. Пустое белое окно
/// выглядит как сломанное приложение, поэтому причина называется прямо.
private struct OfflineView: View {
    let message: String
    let retry: () -> Void

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "wifi.slash")
                .font(.system(size: 44, weight: .light))
                .foregroundStyle(.secondary)
            Text("Приложение не загрузилось")
                .font(.headline)
            Text(message)
                .font(.subheadline)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            Button("Повторить", action: retry)
                .buttonStyle(.borderedProminent)
                .padding(.top, 4)
        }
        .padding(32)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(Color("LaunchBackground"))
    }
}
