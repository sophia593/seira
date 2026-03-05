'use client'

import { Breadcrumbs } from './breadcrumbs'
import { ProductionTabs } from './production-tabs'
import { TopBarUserMenu } from './top-bar-user-menu'

export function TopBar() {
  return (
    <div
      className="flex items-center shrink-0 sticky top-0 z-10"
      style={{
        height: 56,
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid var(--seira-border)',
        padding: '0 24px',
      }}
    >
      {/* Left — breadcrumbs */}
      <div className="flex-1 flex items-center justify-start min-w-0">
        <Breadcrumbs />
      </div>

      {/* Center — production tabs */}
      <div className="flex-none flex items-center justify-center">
        <ProductionTabs />
      </div>

      {/* Right — user avatar */}
      <div className="flex-1 flex items-center justify-end">
        <TopBarUserMenu />
      </div>
    </div>
  )
}
