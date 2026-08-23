import SwiftUI
import VisionKit

struct RootView: View {
    @EnvironmentObject var store: PairStore

    var body: some View {
        if store.paired {
            TabView {
                FleetView()
                    .tabItem { Label("席", systemImage: "square.grid.2x2") }
                SecretaryView()
                    .tabItem { Label("秘書", systemImage: "bubble.left") }
            }
            .tint(Color(red: 0.43, green: 0.91, blue: 0.82))
        } else {
            PairView()
        }
    }
}

struct PairView: View {
    @EnvironmentObject var store: PairStore
    @State private var paste = ""
    @State private var scan = false

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("HISYO")
                .font(.system(size: 12, weight: .semibold, design: .default))
                .tracking(3)
                .foregroundStyle(.secondary)
            Text("Macの設定にあるQRを読む。スマホにも Tailscale。")
                .font(.callout)
                .foregroundStyle(.secondary)
            Button {
                scan = true
            } label: {
                Label("QRを読む", systemImage: "qrcode.viewfinder")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            TextField("URLを貼る", text: $paste)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .keyboardType(.URL)
                .padding(12)
                .background(Color(white: 0.12), in: RoundedRectangle(cornerRadius: 10))
            Button("繋ぐ") {
                store.apply(url: paste)
            }
            .disabled(paste.trimmingCharacters(in: .whitespaces).isEmpty)
            Spacer()
        }
        .padding(20)
        .sheet(isPresented: $scan) {
            QRScan { url in
                store.apply(url: url)
                scan = false
            }
            .ignoresSafeArea()
        }
    }
}

struct QRScan: UIViewControllerRepresentable {
    var onCode: (String) -> Void

    func makeUIViewController(context: Context) -> ScannerVC {
        let vc = ScannerVC()
        vc.onCode = onCode
        return vc
    }

    func updateUIViewController(_ uiViewController: ScannerVC, context: Context) {}
}

final class ScannerVC: UIViewController, DataScannerViewControllerDelegate {
    var onCode: ((String) -> Void)?
    private var scanner: DataScannerViewController?

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        guard DataScannerViewController.isSupported, DataScannerViewController.isAvailable else { return }
        let s = DataScannerViewController(
            recognizedDataTypes: [.barcode(symbologies: [.qr])],
            qualityLevel: .balanced,
            recognizesMultipleItems: false,
            isHighFrameRateTrackingEnabled: false,
            isHighlightingEnabled: true
        )
        s.delegate = self
        addChild(s)
        s.view.frame = view.bounds
        s.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        view.addSubview(s.view)
        s.didMove(toParent: self)
        scanner = s
        try? s.startScanning()
    }

    func dataScanner(_ dataScanner: DataScannerViewController, didTapOn item: RecognizedItem) {
        if case .barcode(let b) = item, let v = b.payloadStringValue {
            DispatchQueue.main.async { [weak self] in
                self?.onCode?(v)
            }
        }
    }

    func dataScanner(_ dataScanner: DataScannerViewController, didAdd addedItems: [RecognizedItem], allItems: [RecognizedItem]) {
        if let item = addedItems.first, case .barcode(let b) = item, let v = b.payloadStringValue {
            DispatchQueue.main.async { [weak self] in
                self?.onCode?(v)
            }
        }
    }
}

enum StatusJP {
    static func label(_ s: String?) -> String {
        switch s {
        case "running": return "実行中"
        case "waiting": return "待ち"
        case "idle": return "待機"
        case "error": return "エラー"
        case "watching": return "監視"
        case "done": return "完了"
        default: return s ?? ""
        }
    }

    static func color(_ s: String?) -> Color {
        switch s {
        case "running": return Color(red: 0.24, green: 0.81, blue: 0.60)
        case "waiting": return Color(red: 0.37, green: 0.77, blue: 0.84)
        case "error": return Color(red: 0.83, green: 0.42, blue: 0.42)
        default: return Color(white: 0.45)
        }
    }
}
