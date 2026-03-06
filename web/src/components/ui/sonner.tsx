"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, toast, type ToasterProps } from "sonner"

function Toaster({ ...props }: ToasterProps) {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      data-slot="toaster-group"
      position="bottom-right"
      duration={4000}
      visibleToasts={3}
      gap={8}
      closeButton
      richColors
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "!bg-white !rounded-[4px] !shadow-[0_4px_12px_rgba(0,0,0,0.1)] !border !border-[#E4E4E7] !w-[360px] !gap-3 !p-3 !px-4",
          title: "!text-[13px] !font-medium !text-[#18181B]",
          description: "!text-[13px] !text-[#71717A] !mt-0.5",
          actionButton:
            "!text-[13px] !font-medium !text-[#C4363A] !bg-transparent !hover:underline !p-0 !h-auto !mt-1.5",
          closeButton:
            "!text-[#A1A1AA] hover:!text-[#71717A] !border-none !bg-transparent",
          success: "!border-l-[3px] !border-l-[#10B981]",
          error: "!border-l-[3px] !border-l-[#E5484D]",
          info: "!border-l-[3px] !border-l-[#3B82F6]",
          warning: "!border-l-[3px] !border-l-[#F59E0B]",
        },
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "4px",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster, toast }
