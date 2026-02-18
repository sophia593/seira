import type { Metadata } from 'next'
import { SettingsNav } from './settings-nav'

export const metadata: Metadata = {
  title: 'settings',
  description: 'manage your profile and account settings',
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-4xl">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>
      <SettingsNav />
      <div className="mt-6">{children}</div>
    </div>
  )
}
