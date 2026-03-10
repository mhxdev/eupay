import { NextResponse } from "next/server"

export function v2Success(data: unknown, requestId: string, status = 200) {
  return NextResponse.json(
    {
      data,
      meta: { requestId, timestamp: new Date().toISOString() },
    },
    { status }
  )
}

export function v2Error(
  code: string,
  message: string,
  requestId: string,
  status: number
) {
  return NextResponse.json(
    {
      error: { code, message },
      meta: { requestId, timestamp: new Date().toISOString() },
    },
    { status }
  )
}
