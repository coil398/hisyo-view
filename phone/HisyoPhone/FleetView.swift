import SwiftUI
import PhotosUI
import UserNotifications

struct FleetView: View {
    @EnvironmentObject var store: PairStore
    @State private var seats: [Seat] = []
    @State private var err = ""
    @State private var noted: Set<String> = []

    private var api: Client { Client(store: store) }
    private var mains: [Seat] { seats.filter { ($0.parentId ?? "").isEmpty } }

    var body: some View {
        NavigationStack {
            List(mains) { s in
                NavigationLink(value: s.id) {
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Circle().fill(StatusJP.color(s.status)).frame(width: 8, height: 8)
                            Text(s.name ?? s.id).font(.headline)
                            Spacer()
                            Text(StatusJP.label(s.status)).font(.caption).foregroundStyle(.secondary)
                        }
                        Text(s.task ?? "—").font(.subheadline).foregroundStyle(.secondary).lineLimit(2)
                        if let g = s.goal, !g.isEmpty {
                            Text("ゴール \(g)").font(.caption).foregroundStyle(Color(red: 0.37, green: 0.77, blue: 0.84))
                        }
                    }
                    .padding(.vertical, 4)
                }
            }
            .listStyle(.plain)
            .navigationTitle("席")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("解除") { store.clear() }
                }
            }
            .navigationDestination(for: String.self) { id in
                SeatView(id: id)
            }
            .refreshable { await load() }
            .overlay {
                if let e = err.nilIfEmpty { Text(e).font(.caption).foregroundStyle(.red).padding() }
            }
            .task {
                UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in }
                await load()
            }
            .onReceive(Timer.publish(every: 4, on: .main, in: .common).autoconnect()) { _ in
                Task { await load() }
            }
            .onReceive(NotificationCenter.default.publisher(for: .hisyoNote)) { n in
                let id = n.userInfo?["id"] as? String ?? ""
                let action = n.userInfo?["action"] as? String ?? ""
                Task { await handleNote(id: id, action: action) }
            }
        }
    }

    private func load() async {
        do {
            seats = try await api.fleet()
            err = ""
            ping(seats)
        } catch {
            err = error.localizedDescription
        }
    }

    private func ping(_ seats: [Seat]) {
        let badge = seats.filter {
            $0.status == "waiting" || $0.status == "error" || !($0.permit?.kind ?? "").isEmpty
        }.count
        UNUserNotificationCenter.current().setBadgeCount(badge)
        let live = Set(seats.map(\.id))
        noted = noted.intersection(live)
        for s in seats {
            let key: String
            if !((s.permit?.kind ?? "").isEmpty) {
                key = "p:\(s.id)"
            } else if s.status == "error" {
                key = "e:\(s.id)"
            } else {
                continue
            }
            if noted.contains(key) { continue }
            noted.insert(key)
            let c = UNMutableNotificationContent()
            if key.hasPrefix("p:") {
                c.title = "承認待ち"
                c.categoryIdentifier = "permit"
                c.sound = .default
            } else {
                c.title = "エラー"
                c.categoryIdentifier = "seat"
                c.sound = .default
            }
            c.subtitle = s.name ?? ""
            c.body = s.permit?.title ?? s.task ?? ""
            c.threadIdentifier = s.id
            c.userInfo = ["id": s.id]
            let r = UNNotificationRequest(identifier: key, content: c, trigger: nil)
            UNUserNotificationCenter.current().add(r)
        }
    }

    private func handleNote(id: String, action: String) async {
        guard let seat = seats.first(where: { $0.id == id }) else { return }
        if action == "allow" || action == "deny" {
            try? await api.permit(seat: seat, action: action)
            await load()
        }
    }
}

struct SeatView: View {
    let id: String
    @EnvironmentObject var store: PairStore
    @State private var seat: Seat?
    @State private var draft = ""
    @State private var err = ""
    @State private var photo: PhotosPickerItem?

    private var api: Client { Client(store: store) }
    private var turns: [Turn] {
        if let t = seat?.turns, !t.isEmpty { return t }
        return seat?.logs ?? []
    }

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: 10) {
                    if let p = seat?.permit, !(p.kind ?? "").isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("承認待ち").font(.caption).foregroundStyle(.secondary)
                            Text(p.title ?? "")
                            Text(p.detail ?? "").font(.caption).foregroundStyle(.secondary)
                            HStack {
                                Button("認める") { Task { await decide("allow") } }
                                    .buttonStyle(.borderedProminent)
                                Button("常に") { Task { await decide("always") } }
                                Button("拒否") { Task { await decide("deny") } }
                            }
                        }
                        .padding()
                        .background(Color(white: 0.10), in: RoundedRectangle(cornerRadius: 12))
                    }
                    ForEach(Array(turns.suffix(40).enumerated()), id: \.offset) { _, t in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(t.role == "user" ? "あなた" : "AI")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                            Text(t.text ?? "")
                        }
                        .padding(10)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(
                            Color(white: t.role == "user" ? 0.14 : 0.09),
                            in: RoundedRectangle(cornerRadius: 12)
                        )
                    }
                }
                .padding()
            }
            HStack {
                PhotosPicker(selection: $photo, matching: .images) {
                    Image(systemName: "photo")
                }
                TextField("送る", text: $draft, axis: .vertical)
                    .lineLimit(1...4)
                    .padding(10)
                    .background(Color(white: 0.12), in: RoundedRectangle(cornerRadius: 10))
                Button("送る") { Task { await send() } }
                    .buttonStyle(.borderedProminent)
                    .disabled(draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
            .padding()
        }
        .onChange(of: photo) { _, item in
            guard let item else { return }
            Task {
                if let data = try? await item.loadTransferable(type: Data.self) {
                    let b64 = data.base64EncodedString()
                    if let path = try? await api.inbox(name: "phone.jpg", b64: b64), let seat {
                        try? await api.send(seat: seat, text: "写真 \(path)")
                        await load()
                    }
                }
            }
        }
        .navigationTitle(seat?.name ?? "…")
        .navigationBarTitleDisplayMode(.inline)
        .task { await load() }
        .overlay {
            if let e = err.nilIfEmpty { Text(e).font(.caption).foregroundStyle(.red) }
        }
    }

    private func load() async {
        do {
            seat = try await api.seat(id)
            err = ""
        } catch { err = error.localizedDescription }
    }

    private func send() async {
        guard let seat else { return }
        let text = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        draft = ""
        do {
            try await api.send(seat: seat, text: text)
            await load()
        } catch { err = error.localizedDescription }
    }

    private func decide(_ action: String) async {
        guard let seat else { return }
        do {
            try await api.permit(seat: seat, action: action)
            await load()
        } catch { err = error.localizedDescription }
    }
}

extension String {
    var nilIfEmpty: String? { isEmpty ? nil : self }
}
