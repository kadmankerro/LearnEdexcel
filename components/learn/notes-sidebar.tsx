"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { X, Save, FileText } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface NotesSidebarProps {
  userId: string
  topicId: number
  isOpen: boolean
  onClose: () => void
}

export function NotesSidebar({ userId, topicId, isOpen, onClose }: NotesSidebarProps) {
  const [notes, setNotes] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadNotes()
  }, [topicId])

  const loadNotes = async () => {
    const { data } = await supabase
      .from("user_notes")
      .select("content, updated_at")
      .eq("user_id", userId)
      .eq("topic_id", topicId)
      .single()

    if (data) {
      setNotes(data.content || "")
      setLastSaved(new Date(data.updated_at))
    } else {
      setNotes("")
      setLastSaved(null)
    }
  }

  const saveNotes = async () => {
    setIsSaving(true)
    try {
      await supabase.from("user_notes").upsert(
        {
          user_id: userId,
          topic_id: topicId,
          content: notes,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,topic_id",
        },
      )
      setLastSaved(new Date())
    } catch (error) {
      console.error("Error saving notes:", error)
    } finally {
      setIsSaving(false)
    }
  }

  // Auto-save every 30 seconds if there are changes
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (notes && !isSaving) {
        saveNotes()
      }
    }, 30000)

    return () => clearInterval(autoSaveInterval)
  }, [notes, isSaving])

  if (!isOpen) return null

  return (
    <div className="fixed right-0 top-16 bottom-0 w-96 border-l bg-background shadow-2xl z-50 flex flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Your Notes</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write your notes here... They will be automatically saved."
          className="min-h-[calc(100vh-200px)] resize-none border-0 focus-visible:ring-0 text-sm leading-relaxed"
        />
      </ScrollArea>

      <div className="border-t p-4 space-y-2">
        <Button onClick={saveNotes} disabled={isSaving} className="w-full">
          {isSaving ? "Saving..." : "Save Notes"}
          <Save className="ml-2 h-4 w-4" />
        </Button>
        {lastSaved && (
          <p className="text-xs text-muted-foreground text-center">Last saved: {lastSaved.toLocaleTimeString()}</p>
        )}
      </div>
    </div>
  )
}
