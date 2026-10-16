import SwiftUI
import WebKit

/// Состояние загрузки, общее для обёртки и экрана ошибки.
final class WebViewModel: ObservableObject {
    @Published var failed = false
    @Published var failureMessage = ""

    /// Ссылку на сам WKWebView держит обёртка: кнопка «Повторить» должна
    /// перезагружать уже созданное представление, а не создавать новое —
    /// иначе теряется история и состояние страницы.
    fileprivate weak var webView: WKWebView?

    /// Мост живёт столько же, сколько представление: обработчик сообщений
    /// WebKit держит слабо, и без своей ссылки он умрёт сразу после создания.
    fileprivate var bridge: Bridge?

    /// Отметки из виджета отдаём странице при каждом возвращении в приложение.
    func wokeUp() {
        bridge?.flushMarks()
    }

    func reload() {
        failed = false
        guard let webView else { return }
        if webView.url == nil {
            webView.load(URLRequest(url: Config.appURL))
        } else {
            webView.reload()
        }
    }
}

struct WebView: UIViewRepresentable {
    @ObservedObject var model: WebViewModel

    func makeCoordinator() -> Coordinator {
        Coordinator(model: model)
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        // Постоянное хранилище: приложение держит все данные в localStorage,
        // и после закрытия они обязаны остаться на месте.
        configuration.websiteDataStore = .default()
        configuration.allowsInlineMediaPlayback = true
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true

        // Канал к странице: она присылает снимок дня для виджета, а
        // получает обратно отметки, сделанные кнопкой в виджете.
        // Регистрируется до создания представления: настройки копируются
        // в момент инициализации, и поздние правки уже не учитываются.
        let bridge = Bridge()
        configuration.userContentController.add(bridge, name: Bridge.channel)

        let webView = WKWebView(frame: .zero, configuration: configuration)
        bridge.webView = webView
        model.bridge = bridge

        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = false
        webView.isOpaque = false
        webView.backgroundColor = .clear
        // Отступы считает страница через safe-area, а не система: иначе
        // отступ прибавляется дважды и внизу остаётся пустая полоса.
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        // Оттяжка за край выдаёт обёртку: в приложении её быть не должно.
        webView.scrollView.bounces = false
        webView.scrollView.alwaysBounceVertical = false

        model.webView = webView
        webView.load(URLRequest(url: Config.appURL))
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}

    final class Coordinator: NSObject, WKNavigationDelegate, WKUIDelegate {
        private let model: WebViewModel

        init(model: WebViewModel) {
            self.model = model
        }

        func webView(
            _ webView: WKWebView,
            decidePolicyFor navigationAction: WKNavigationAction,
            decisionHandler: @escaping (WKNavigationActionPolicy) -> Void
        ) {
            guard let url = navigationAction.request.url else {
                decisionHandler(.cancel)
                return
            }
            if url.host == Config.allowedHost || url.scheme == "about" {
                decisionHandler(.allow)
                return
            }
            // Внешнюю ссылку отдаём Safari, а не показываем внутри.
            decisionHandler(.cancel)
            if ["http", "https", "mailto", "tel"].contains(url.scheme ?? "") {
                UIApplication.shared.open(url)
            }
        }

        /// target="_blank" открывается без окна-обёртки, иначе ссылка
        /// просто не срабатывает и выглядит как сломанная кнопка.
        func webView(
            _ webView: WKWebView,
            createWebViewWith configuration: WKWebViewConfiguration,
            for navigationAction: WKNavigationAction,
            windowFeatures: WKWindowFeatures
        ) -> WKWebView? {
            if let url = navigationAction.request.url, url.host != Config.allowedHost {
                UIApplication.shared.open(url)
            } else if let url = navigationAction.request.url {
                webView.load(URLRequest(url: url))
            }
            return nil
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            model.failed = false
            // Страница загрузилась — самое время отдать ей отметки,
            // накопившиеся в виджете, пока приложение было закрыто.
            model.wokeUp()
        }

        func webView(
            _ webView: WKWebView,
            didFail navigation: WKNavigation!,
            withError error: Error
        ) {
            show(error)
        }

        func webView(
            _ webView: WKWebView,
            didFailProvisionalNavigation navigation: WKNavigation!,
            withError error: Error
        ) {
            show(error)
        }

        private func show(_ error: Error) {
            // Отменённую загрузку за ошибку не считаем: так выглядит
            // обычный переход, прерванный следующим.
            let code = (error as NSError).code
            guard code != NSURLErrorCancelled else { return }
            model.failureMessage = error.localizedDescription
            model.failed = true
        }
    }
}
