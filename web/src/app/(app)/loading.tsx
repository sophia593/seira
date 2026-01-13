import { Loader2 } from "lucide-react"

export default function AppLoading() {
  return (
    <div className="flex items-center justify-center min-h-[50vh] animate-in fade-in duration-300">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}
