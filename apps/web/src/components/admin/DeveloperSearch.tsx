"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export function DeveloperSearch({
  onSearch,
}: {
  onSearch: (query: string) => void
}) {
  const [value, setValue] = useState("")

  return (
    <div className="relative w-64">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search by email or name..."
        value={value}
        onChange={(e) => {
          setValue(e.target.value)
          onSearch(e.target.value)
        }}
        className="pl-9 h-9 text-sm"
      />
    </div>
  )
}
