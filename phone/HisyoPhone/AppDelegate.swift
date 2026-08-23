import UIKit
import UserNotifications

extension Notification.Name {
    static let hisyoNote = Notification.Name("hisyo.note")
}

final class AppDelegate: NSObject, UIApplicationDelegate, UNUserNotificationCenterDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        let allow = UNNotificationAction(identifier: "allow", title: "認める", options: [])
        let deny = UNNotificationAction(identifier: "deny", title: "拒否", options: .destructive)
        let open = UNNotificationAction(identifier: "open", title: "開く", options: .foreground)
        let permit = UNNotificationCategory(
            identifier: "permit",
            actions: [allow, deny, open],
            intentIdentifiers: [],
            options: []
        )
        let plain = UNNotificationCategory(
            identifier: "seat",
            actions: [open],
            intentIdentifiers: [],
            options: []
        )
        UNUserNotificationCenter.current().setNotificationCategories([permit, plain])
        UNUserNotificationCenter.current().delegate = self
        return true
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .sound, .badge])
    }

    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let id = response.notification.request.content.userInfo["id"] as? String ?? response.notification.request.identifier
        NotificationCenter.default.post(
            name: .hisyoNote,
            object: nil,
            userInfo: ["id": id, "action": response.actionIdentifier]
        )
        completionHandler()
    }
}
