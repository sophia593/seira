import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "saved plans",
  description: "view and manage your saved plans",
}

export default function SavedLayout({ children }: { children: React.ReactNode }) {
  return children
}
