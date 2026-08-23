import SwiftUI

@main
struct HisyoPhoneApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var app
    @StateObject private var store = PairStore()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(store)
                .preferredColorScheme(.dark)
        }
    }
}
