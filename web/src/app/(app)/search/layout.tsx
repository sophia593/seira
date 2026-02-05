import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "search events",
  description: "find concerts, sports, theater, and live events to build your trip around",
}

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children
}
