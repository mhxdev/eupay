import SwiftUI
import UIKit

/// DMA-mandated informational disclosure modal.
///
/// Under DMA Article 5(7), when an EU user initiates an in-app purchase
/// via an alternative payment provider, this disclosure MUST be shown.
/// It informs the user they are leaving Apple's payment system.
///
/// This modal is **legally required** — do not make it dismissible without user action.
@MainActor
struct DMADisclosureView: View {
    let onAccept: () -> Void
    let onDecline: () -> Void

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "creditcard")
                .font(.system(size: 48))
                .foregroundColor(.blue)

            Text("Zahlung außerhalb des App Store")
                .font(.headline)
                .multilineTextAlignment(.center)

            Text("""
                Sie werden zu einem Zahlungsanbieter außerhalb des App Store weitergeleitet.

                Apple ist nicht für die Zahlungsabwicklung verantwortlich. \
                Für Hilfe wenden Sie sich direkt an den App-Entwickler.

                Diese Zahlung unterliegt den Datenschutz- und Rückgabebedingungen \
                des Entwicklers.
                """)
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)

            Text("Hinweis: Apple bietet für diese Zahlung keinen Käuferschutz.")
                .font(.footnote)
                .foregroundColor(.orange)
                .multilineTextAlignment(.center)
                .padding(8)
                .background(Color.orange.opacity(0.1))
                .cornerRadius(8)

            VStack(spacing: 12) {
                Button("Weiter zum Bezahlen", action: onAccept)
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)

                Button("Abbrechen", action: onDecline)
                    .buttonStyle(.bordered)
                    .controlSize(.large)
            }
        }
        .padding(24)
    }
}

/// Presents the DMA disclosure sheet and returns whether the user accepted.
enum DMADisclosure {
    @MainActor
    static func present(from viewController: UIViewController) async -> Bool {
        return await withCheckedContinuation { continuation in
            var didResume = false

            let hostingController = UIHostingController(
                rootView: DMADisclosureView(
                    onAccept: {
                        guard !didResume else { return }
                        didResume = true
                        viewController.dismiss(animated: true) {
                            continuation.resume(returning: true)
                        }
                    },
                    onDecline: {
                        guard !didResume else { return }
                        didResume = true
                        viewController.dismiss(animated: true) {
                            continuation.resume(returning: false)
                        }
                    }
                )
            )
            hostingController.modalPresentationStyle = .pageSheet
            hostingController.isModalInPresentation = true // Prevent swipe dismiss

            if let sheet = hostingController.sheetPresentationController {
                sheet.detents = [.medium()]
                sheet.prefersGrabberVisible = true
            }

            viewController.present(hostingController, animated: true)
        }
    }
}
