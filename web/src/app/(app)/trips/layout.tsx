import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "my trips",
  description: "view and manage your planned trips",
}

export default function TripsLayout({ children }: { children: React.ReactNode }) {
  return children
}
