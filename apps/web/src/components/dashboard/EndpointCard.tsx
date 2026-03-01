"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChevronDown, ChevronRight, Send, Copy, Check } from "lucide-react"

export type EndpointParam = {
  name: string
  type: string
  required: boolean
  description: string
  location: "path" | "query" | "body"
}

export type EndpointDef = {
  id: string
  method: "GET" | "POST" | "PATCH" | "DELETE"
  path: string
  description: string
  category: string
  params: EndpointParam[]
  exampleBody: object | null
  exampleResponse: object
}

const METHOD_STYLES: Record<string, string> = {
  GET: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  POST: "bg-green-100 text-green-800 hover:bg-green-100",
  PATCH: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  DELETE: "bg-red-100 text-red-800 hover:bg-red-100",
}

type TryResult = {
  status: number
  time: number
  body: string
} | null

export function EndpointCard({
  endpoint,
  apiKey,
  expanded,
  onToggle,
}: {
  endpoint: EndpointDef
  apiKey: string
  expanded: boolean
  onToggle: () => void
}) {
  const [paramValues, setParamValues] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {}
    for (const p of endpoint.params) {
      defaults[p.name] = ""
    }
    return defaults
  })
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<TryResult>(null)
  const [copiedCurl, setCopiedCurl] = useState(false)

  function buildUrl() {
    let url = endpoint.path
    const queryParams: string[] = []

    for (const p of endpoint.params) {
      const val = paramValues[p.name]
      if (!val) continue
      if (p.location === "path") {
        url = url.replace(`{${p.name}}`, encodeURIComponent(val))
      } else if (p.location === "query") {
        queryParams.push(`${p.name}=${encodeURIComponent(val)}`)
      }
    }

    if (queryParams.length > 0) {
      url += `?${queryParams.join("&")}`
    }
    return url
  }

  function buildBody(): string | null {
    if (endpoint.method === "GET") return null
    const bodyParams = endpoint.params.filter((p) => p.location === "body")
    if (bodyParams.length === 0) return null
    const body: Record<string, unknown> = {}
    for (const p of bodyParams) {
      const val = paramValues[p.name]
      if (!val) continue
      if (p.type === "boolean") {
        body[p.name] = val === "true"
      } else {
        body[p.name] = val
      }
    }
    return JSON.stringify(body)
  }

  function buildCurl(): string {
    const url = `${window.location.origin}${buildUrl()}`
    const parts = [`curl -X ${endpoint.method}`]
    parts.push(`  -H "Authorization: Bearer ${apiKey || "YOUR_API_KEY"}"`)
    const body = buildBody()
    if (body) {
      parts.push(`  -H "Content-Type: application/json"`)
      parts.push(`  -d '${body}'`)
    }
    parts.push(`  "${url}"`)
    return parts.join(" \\\n")
  }

  function handleCopyCurl() {
    navigator.clipboard.writeText(buildCurl())
    setCopiedCurl(true)
    setTimeout(() => setCopiedCurl(false), 2000)
  }

  async function handleSend() {
    setSending(true)
    setResult(null)
    const url = buildUrl()
    const body = buildBody()
    const start = Date.now()

    try {
      const headers: Record<string, string> = {
        Authorization: `Bearer ${apiKey}`,
      }
      if (body) headers["Content-Type"] = "application/json"

      const res = await fetch(url, {
        method: endpoint.method,
        headers,
        body: body ?? undefined,
      })
      const text = await res.text()
      setResult({
        status: res.status,
        time: Date.now() - start,
        body: formatJson(text),
      })
    } catch (e) {
      setResult({
        status: 0,
        time: Date.now() - start,
        body: e instanceof Error ? e.message : "Request failed",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <Card id={endpoint.id}>
      <CardHeader
        className="cursor-pointer select-none py-3"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <Badge className={METHOD_STYLES[endpoint.method]}>
            {endpoint.method}
          </Badge>
          <code className="text-sm font-mono">{endpoint.path}</code>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            — {endpoint.description}
          </span>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-5 pt-0">
          <p className="text-sm text-muted-foreground sm:hidden">
            {endpoint.description}
          </p>

          {/* Auth */}
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Authentication
            </Label>
            <p className="text-sm mt-1">
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                Authorization: Bearer &lt;API_KEY&gt;
              </code>
            </p>
          </div>

          {/* Parameters */}
          {endpoint.params.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Parameters
              </Label>
              <div className="mt-1 rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Name</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">In</TableHead>
                      <TableHead className="text-xs">Required</TableHead>
                      <TableHead className="text-xs">Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {endpoint.params.map((p) => (
                      <TableRow key={p.name}>
                        <TableCell>
                          <code className="text-xs">{p.name}</code>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {p.type}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {p.location}
                        </TableCell>
                        <TableCell>
                          {p.required ? (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5"
                            >
                              required
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              optional
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {p.description}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Example Request */}
          {endpoint.exampleBody && (
            <div>
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Example Request
              </Label>
              <pre className="mt-1 rounded-md bg-[#1e1e1e] p-4 text-xs font-mono text-gray-300 overflow-auto max-h-48">
                {JSON.stringify(endpoint.exampleBody, null, 2)}
              </pre>
            </div>
          )}

          {/* Example Response */}
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Example Response
            </Label>
            <pre className="mt-1 rounded-md bg-[#1e1e1e] p-4 text-xs font-mono text-gray-300 overflow-auto max-h-48">
              {JSON.stringify(endpoint.exampleResponse, null, 2)}
            </pre>
          </div>

          {/* Try It */}
          <div className="border-t pt-4 space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Try It
            </Label>

            <div className="grid gap-3 sm:grid-cols-2">
              {endpoint.params.map((p) => (
                <div key={p.name} className="space-y-1">
                  <Label htmlFor={`${endpoint.id}-${p.name}`} className="text-xs">
                    {p.name}
                    {p.required && (
                      <span className="text-red-500 ml-0.5">*</span>
                    )}
                  </Label>
                  <Input
                    id={`${endpoint.id}-${p.name}`}
                    value={paramValues[p.name]}
                    onChange={(e) =>
                      setParamValues((prev) => ({
                        ...prev,
                        [p.name]: e.target.value,
                      }))
                    }
                    placeholder={p.description}
                    className="text-sm font-mono"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSend}
                disabled={sending}
                size="sm"
              >
                <Send className="h-3.5 w-3.5 mr-1" />
                {sending ? "Sending..." : "Send Request"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCurl}
              >
                {copiedCurl ? (
                  <Check className="h-3.5 w-3.5 mr-1" />
                ) : (
                  <Copy className="h-3.5 w-3.5 mr-1" />
                )}
                {copiedCurl ? "Copied!" : "Copy as cURL"}
              </Button>
            </div>

            {result && (
              <div className="rounded-md border bg-muted/30 p-3 space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <Badge
                    className={
                      result.status >= 200 && result.status < 300
                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                        : "bg-red-100 text-red-800 hover:bg-red-100"
                    }
                  >
                    {result.status || "Error"}
                  </Badge>
                  <span className="text-muted-foreground">
                    {result.time}ms
                  </span>
                </div>
                <pre className="rounded-md bg-[#1e1e1e] p-3 text-xs font-mono text-gray-300 overflow-auto max-h-60">
                  {result.body}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

function formatJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2)
  } catch {
    return text
  }
}
