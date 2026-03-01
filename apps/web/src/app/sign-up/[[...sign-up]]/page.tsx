import { SignUp } from "@clerk/nextjs"
import Link from "next/link"

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0f1e] px-4">
      <Link href="/" className="mb-8 text-2xl font-bold text-white">
        EUPay
      </Link>
      <SignUp forceRedirectUrl="/onboarding" />
      <p className="mt-6 text-sm text-gray-500">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="text-teal-400 underline underline-offset-2 hover:text-teal-300"
        >
          Sign in
        </Link>
      </p>
    </div>
  )
}
