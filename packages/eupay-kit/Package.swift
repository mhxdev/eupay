// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "EuroPayKit",
    platforms: [.iOS(.v16)],
    products: [
        .library(name: "EuroPayKit", targets: ["EuroPayKit"])
    ],
    dependencies: [],  // Zero external dependencies
    targets: [
        .target(
            name: "EuroPayKit",
            dependencies: [],
            path: "Sources/EuroPayKit"
        ),
        .testTarget(
            name: "EuroPayKitTests",
            dependencies: ["EuroPayKit"]
        )
    ]
)
