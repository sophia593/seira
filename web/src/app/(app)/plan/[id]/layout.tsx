import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "plan",
  description: "build your trip with flights, hotels, and event tickets",
}

export default function PlanLayout({ children }: { children: React.ReactNode }) {
  return children
}
