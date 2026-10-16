import WidgetKit
import SwiftUI

@main
struct KamronWidgetsBundle: WidgetBundle {
    var body: some Widget {
        DayWidget()
        if #available(iOS 16.2, *) {
            KamronLiveActivity()
        }
    }
}
