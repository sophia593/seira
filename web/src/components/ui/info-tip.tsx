'use client'

import { HelpCircle } from 'lucide-react'
import { Tooltip, TooltipTrigger, TooltipContent } from './tooltip'

interface InfoTipProps {
  text: string
  side?: 'top' | 'bottom' | 'left' | 'right'
}

export function InfoTip({ text, side = 'top' }: InfoTipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="inline w-3.5 h-3.5 text-muted-foreground/50 hover:text-muted-foreground cursor-help shrink-0" />
      </TooltipTrigger>
      <TooltipContent side={side} className="max-w-xs">
        {text}
      </TooltipContent>
    </Tooltip>
  )
}
