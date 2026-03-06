// GET /api/v1/compliance/pdf
// Redirects to the web-based Data Processing Agreement page.
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/dpa", request.url))
}
