import Foundation

struct Seat: Codable, Identifiable {
    var id: String
    var name: String?
    var runtime: String?
    var model: String?
    var status: String?
    var task: String?
    var goal: String?
    var cwd: String?
    var sessionId: String?
    var parentId: String?
    var permit: Permit?
    var turns: [Turn]?
    var logs: [Turn]?
}

struct Permit: Codable {
    var kind: String?
    var title: String?
    var detail: String?
    var callId: String?
}

struct Turn: Codable {
    var role: String?
    var text: String?
}

struct ChatLine: Codable {
    var id: String?
    var role: String?
    var text: String?
    var at: UInt64?
}

struct HomeState: Codable {
    var messages: [ChatLine]?
}

struct SendOut: Codable {
    var ok: Bool?
    var text: String?
    var error: String?
}

enum ClientError: LocalizedError {
    case pair, http(Int), body(String)
    var errorDescription: String? {
        switch self {
        case .pair: return "まだ繋がっていない"
        case .http(let c): return "HTTP \(c)"
        case .body(let s): return s
        }
    }
}

struct Client {
    let origin: String
    let token: String

    init(store: PairStore) {
        origin = store.origin
        token = store.token
    }

    func fleet() async throws -> [Seat] {
        try await get("/api/fleet")
    }

    func seat(_ id: String) async throws -> Seat? {
        try await get("/api/seat", query: ["id": id])
    }

    func send(seat: Seat, text: String) async throws {
        let _: SendOut = try await post("/api/send", [
            "runtime": seat.runtime ?? "",
            "sessionId": seat.sessionId ?? "",
            "cwd": seat.cwd ?? "",
            "text": text,
        ])
    }

    func permit(seat: Seat, action: String) async throws {
        let _: SendOut = try await post("/api/permit", [
            "runtime": seat.runtime ?? "",
            "sessionId": seat.sessionId ?? "",
            "cwd": seat.cwd ?? "",
            "action": action,
            "callId": seat.permit?.callId ?? "",
        ])
    }

    func secretary() async throws -> HomeState {
        try await get("/api/secretary")
    }

    func ask(_ text: String, voice: Bool = false) async throws -> String {
        let out: SendOut = try await post("/api/secretary", [
            "text": text,
            "fleet": "",
            "voice": voice ? "true" : "false",
        ])
        if let e = out.error, !e.isEmpty { throw ClientError.body(e) }
        return out.text ?? ""
    }

    func inbox(name: String, b64: String) async throws -> String {
        let out: SendOut = try await post("/api/inbox", ["name": name, "b64": b64])
        if let e = out.error, !e.isEmpty { throw ClientError.body(e) }
        return out.text ?? out.ok.flatMap { _ in "" } ?? ""
    }

    private func makeURL(_ path: String, query: [String: String] = [:]) throws -> URL {
        guard !origin.isEmpty, !token.isEmpty else { throw ClientError.pair }
        guard var c = URLComponents(string: origin + path) else { throw ClientError.pair }
        var items = [URLQueryItem(name: "k", value: token)]
        for (k, v) in query { items.append(URLQueryItem(name: k, value: v)) }
        c.queryItems = items
        guard let u = c.url else { throw ClientError.pair }
        return u
    }

    private func get<T: Decodable>(_ path: String, query: [String: String] = [:]) async throws -> T {
        var req = URLRequest(url: try makeURL(path, query: query))
        req.timeoutInterval = 12
        return try await decode(req)
    }

    private func post<T: Decodable>(_ path: String, _ body: [String: String]) async throws -> T {
        var req = URLRequest(url: try makeURL(path))
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        var body = body
        body["k"] = token
        req.httpBody = try JSONEncoder().encode(body)
        req.timeoutInterval = 30
        return try await decode(req)
    }

    private func decode<T: Decodable>(_ req: URLRequest) async throws -> T {
        let (data, resp) = try await URLSession.shared.data(for: req)
        let code = (resp as? HTTPURLResponse)?.statusCode ?? 0
        if code == 401 { throw ClientError.body("鍵が違う。QRを読み直す") }
        if !(200...299).contains(code) {
            if let s = String(data: data, encoding: .utf8), !s.isEmpty { throw ClientError.body(s) }
            throw ClientError.http(code)
        }
        return try JSONDecoder().decode(T.self, from: data)
    }
}
