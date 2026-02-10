import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <div className="text-6xl sm:text-8xl font-bold text-muted-foreground/20 mb-4">
          404
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold mb-2">Page not found</h1>
        <p className="text-sm text-muted-foreground mb-8">
          This page doesn&apos;t exist.
        </p>
        <Button asChild size="lg">
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
