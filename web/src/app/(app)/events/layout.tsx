import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "events",
  description: "find concerts, sports, theater, and live events",
}

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children
}
