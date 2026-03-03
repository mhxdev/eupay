// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "EuroPayKitExample",
    platforms: [.iOS(.v16)],
    dependencies: [
        .package(path: "../europay-kit")
    ],
    targets: [
        .executableTarget(
            name: "EuroPayKitExample",
            dependencies: [
                .product(name: "EuroPayKit", package: "europay-kit")
            ],
            path: "EuroPayKitExample"
        )
    ]
)
