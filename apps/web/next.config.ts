import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Strict mode for React
  reactStrictMode: true,
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: "[TODO: sentry-org]",
  project: "[TODO: sentry-project]",
});
