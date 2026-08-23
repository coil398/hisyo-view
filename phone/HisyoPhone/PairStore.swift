import Foundation
import SwiftUI

final class PairStore: ObservableObject {
    @Published var origin: String
    @Published var token: String

    var paired: Bool { !origin.isEmpty && !token.isEmpty }

    init() {
        origin = UserDefaults.standard.string(forKey: "origin") ?? ""
        token = UserDefaults.standard.string(forKey: "token") ?? ""
    }

    func apply(url: String) {
        guard let u = URL(string: url.trimmingCharacters(in: .whitespacesAndNewlines)) else { return }
        var origin = "\(u.scheme ?? "http")://\(u.host ?? "")"
        if let port = u.port { origin += ":\(port)" }
        let k = URLComponents(url: u, resolvingAgainstBaseURL: false)?
            .queryItems?.first(where: { $0.name == "k" })?.value ?? token
        self.origin = origin
        self.token = k
        UserDefaults.standard.set(origin, forKey: "origin")
        UserDefaults.standard.set(k, forKey: "token")
    }

    func clear() {
        origin = ""
        token = ""
        UserDefaults.standard.removeObject(forKey: "origin")
        UserDefaults.standard.removeObject(forKey: "token")
    }
}
