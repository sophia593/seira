import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "events",
  description: "manage your events and partner deliverables",
}

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children
}
