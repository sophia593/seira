"use client"

import { useEffect } from "react"
import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function AppError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("App error:", error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 px-4">
      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-medium mb-1 lowercase">something went wrong</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          we hit an unexpected error. your data is safe.
        </p>
      </div>
      <Button onClick={reset} className="gap-2 lowercase">
        <RefreshCw className="h-4 w-4" />
        try again
      </Button>
    </div>
  )
}
