// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "EUPayKitExample",
    platforms: [.iOS(.v16)],
    dependencies: [
        .package(path: "../eupay-kit")
    ],
    targets: [
        .executableTarget(
            name: "EUPayKitExample",
            dependencies: [
                .product(name: "EUPayKit", package: "eupay-kit")
            ],
            path: "EUPayKitExample"
        )
    ]
)
