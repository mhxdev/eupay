"use client"

import { useState, useTransition } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { addAdminNote, deleteAdminNote } from "@/lib/actions"
import { Trash2 } from "lucide-react"

type Note = {
  id: string
  content: string
  createdAt: Date
}

export function AdminNotes({
  developerUserId,
  notes,
}: {
  developerUserId: string
  notes: Note[]
}) {
  const [content, setContent] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleAdd() {
    if (!content.trim()) return
    startTransition(async () => {
      await addAdminNote(developerUserId, content)
      setContent("")
    })
  }

  function handleDelete(noteId: string) {
    startTransition(async () => {
      await deleteAdminNote(noteId)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Textarea
          placeholder="Add a note about this developer..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="text-sm min-h-[60px]"
          disabled={isPending}
        />
        <Button
          onClick={handleAdd}
          disabled={isPending || !content.trim()}
          size="sm"
          className="self-end"
        >
          Add
        </Button>
      </div>

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes yet</p>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => (
            <div
              key={note.id}
              className="flex items-start justify-between gap-2 rounded-md border border-border p-3"
            >
              <div>
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {note.createdAt.toLocaleDateString("en-GB")}{" "}
                  {note.createdAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => handleDelete(note.id)}
                disabled={isPending}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
