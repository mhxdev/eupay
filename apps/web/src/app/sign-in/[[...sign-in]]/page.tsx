import { SignIn } from "@clerk/nextjs"
import Link from "next/link"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0f1e] px-4">
      <Link href="/" className="mb-8 text-2xl font-bold text-white">
        EUPay
      </Link>
      <SignIn forceRedirectUrl="/dashboard" />
      <p className="mt-6 text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/sign-up"
          className="text-teal-400 underline underline-offset-2 hover:text-teal-300"
        >
          Sign up
        </Link>
      </p>
    </div>
  )
}
