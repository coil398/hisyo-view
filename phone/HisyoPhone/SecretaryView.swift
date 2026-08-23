import SwiftUI
import Speech
import AVFoundation

struct SecretaryView: View {
    @EnvironmentObject var store: PairStore
    @State private var lines: [ChatLine] = []
    @State private var draft = ""
    @State private var err = ""
    @State private var talking = false
    @State private var rec: SFSpeechAudioBufferRecognitionRequest?
    @State private var task: SFSpeechRecognitionTask?
    @State private var engine = AVAudioEngine()

    private var api: Client { Client(store: store) }
    private let synth = AVSpeechSynthesizer()

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                ScrollView {
                    VStack(alignment: .leading, spacing: 10) {
                        ForEach(Array(lines.suffix(30).enumerated()), id: \.offset) { _, m in
                            VStack(alignment: .leading, spacing: 4) {
                                Text(m.role == "user" ? "あなた" : "秘書")
                                    .font(.caption2)
                                    .foregroundStyle(.secondary)
                                Text(m.text ?? "")
                            }
                            .padding(10)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(
                                Color(white: m.role == "user" ? 0.14 : 0.09),
                                in: RoundedRectangle(cornerRadius: 12)
                            )
                        }
                    }
                    .padding()
                }
                HStack {
                    Button {
                        talking.toggle()
                        if talking { startListen() } else { stopListen() }
                    } label: {
                        Image(systemName: talking ? "stop.fill" : "mic.fill")
                    }
                    TextField("秘書に話す", text: $draft, axis: .vertical)
                        .lineLimit(1...4)
                        .padding(10)
                        .background(Color(white: 0.12), in: RoundedRectangle(cornerRadius: 10))
                    Button("送る") { Task { await send(draft) } }
                        .buttonStyle(.borderedProminent)
                        .disabled(draft.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
                .padding()
            }
            .navigationTitle("秘書")
            .task { await load() }
            .overlay {
                if let e = err.nilIfEmpty { Text(e).font(.caption).foregroundStyle(.red) }
            }
        }
    }

    private func load() async {
        do {
            lines = try await api.secretary().messages ?? []
            err = ""
        } catch { err = error.localizedDescription }
    }

    private func send(_ raw: String) async {
        let text = raw.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        draft = ""
        lines.append(ChatLine(id: UUID().uuidString, role: "user", text: text, at: nil))
        do {
            let reply = try await api.ask(text, voice: talking)
            lines.append(ChatLine(id: UUID().uuidString, role: "assistant", text: reply, at: nil))
            err = ""
            if talking { speak(reply) }
        } catch { err = error.localizedDescription }
    }

    private func speak(_ text: String) {
        let u = AVSpeechUtterance(string: String(text.prefix(80)))
        u.voice = AVSpeechSynthesisVoice(language: "ja-JP")
        u.rate = 0.48
        synth.speak(u)
    }

    private func startListen() {
        SFSpeechRecognizer.requestAuthorization { st in
            guard st == .authorized else { return }
            DispatchQueue.main.async { self.runListen() }
        }
    }

    private func runListen() {
        stopListen()
        guard let recg = SFSpeechRecognizer(locale: Locale(identifier: "ja-JP")) else { return }
        let req = SFSpeechAudioBufferRecognitionRequest()
        req.shouldReportPartialResults = false
        rec = req
        let input = engine.inputNode
        let fmt = input.outputFormat(forBus: 0)
        input.removeTap(onBus: 0)
        input.installTap(onBus: 0, bufferSize: 1024, format: fmt) { buf, _ in
            req.append(buf)
        }
        try? AVAudioSession.sharedInstance().setCategory(.playAndRecord, mode: .measurement, options: .defaultToSpeaker)
        try? AVAudioSession.sharedInstance().setActive(true)
        try? engine.start()
        task = recg.recognitionTask(with: req) { result, _ in
            guard let t = result?.bestTranscription.formattedString, result?.isFinal == true else { return }
            Task { await send(t) }
        }
    }

    private func stopListen() {
        rec?.endAudio()
        task?.cancel()
        engine.stop()
        engine.inputNode.removeTap(onBus: 0)
        rec = nil
        task = nil
    }
}
