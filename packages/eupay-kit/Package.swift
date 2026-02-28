// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "EUPayKit",
    platforms: [.iOS(.v16)],
    products: [
        .library(name: "EUPayKit", targets: ["EUPayKit"])
    ],
    dependencies: [],  // Zero external dependencies
    targets: [
        .target(
            name: "EUPayKit",
            dependencies: [],
            path: "Sources/EUPayKit"
        ),
        .testTarget(
            name: "EUPayKitTests",
            dependencies: ["EUPayKit"]
        )
    ]
)
