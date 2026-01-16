'use client'

import { useState } from 'react'
import { Mail, Loader2, RefreshCw, CheckCircle } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

interface EmailVerificationPromptProps {
  title?: string
  description?: string
  className?: string
}

export function EmailVerificationPrompt({
  title = 'verify your email to save trips',
  description,
  className,
}: EmailVerificationPromptProps) {
  const { user, resendVerificationEmail } = useAuth()
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState('')

  async function handleResend() {
    if (isResending || resendSuccess) return

    setIsResending(true)
    setResendError('')

    try {
      await resendVerificationEmail()
      setResendSuccess(true)
      // Reset success state after 60 seconds
      setTimeout(() => setResendSuccess(false), 60000)
    } catch (err) {
      setResendError(
        err instanceof Error
          ? err.message
          : 'failed to resend. please try again.'
      )
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8',
        className
      )}
    >
      {/* Icon */}
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Mail className="h-8 w-8 text-primary" />
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold lowercase mb-2">{title}</h2>

      {/* Description */}
      <p className="text-muted-foreground text-sm mb-1">
        {description || 'we sent a verification link to'}
      </p>
      {user?.email && (
        <p className="font-medium text-foreground mb-6">{user.email}</p>
      )}

      {/* Resend Button */}
      <button
        onClick={handleResend}
        disabled={isResending || resendSuccess}
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-xl',
          'text-sm font-medium transition-all duration-150',
          resendSuccess
            ? 'bg-green-500/10 text-green-600 dark:text-green-500'
            : 'bg-primary/10 text-primary hover:bg-primary/20',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
      >
        {isResending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            sending...
          </>
        ) : resendSuccess ? (
          <>
            <CheckCircle className="h-4 w-4" />
            email sent!
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            resend verification email
          </>
        )}
      </button>

      {/* Error */}
      {resendError && (
        <p className="text-xs text-destructive mt-2">{resendError}</p>
      )}

      {/* Help text */}
      <p className="text-xs text-muted-foreground mt-6">
        check your spam folder if you don't see it
      </p>
    </div>
  )
}
