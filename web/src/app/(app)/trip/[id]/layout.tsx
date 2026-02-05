import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "trip builder",
  description: "build your trip with flights, hotels, and event tickets",
}

export default function TripLayout({ children }: { children: React.ReactNode }) {
  return children
}
