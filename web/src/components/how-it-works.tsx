"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { MessageSquare, Search, Ticket, Plane, Hotel, Check, ArrowRight } from "lucide-react"

// =============================================================================
// Step Data
// =============================================================================

const STEPS = [
  {
    number: "01",
    title: "tell us the event",
    description: "Just type what you want to see — a concert, game, festival, anything.",
    icon: MessageSquare,
    demo: {
      type: "chat",
      messages: [
        { role: "user", text: "i want to see the lakers play in LA" },
        { role: "assistant", text: "Found 8 Lakers home games this month..." },
      ],
    },
  },
  {
    number: "02",
    title: "we find everything",
    description: "Tickets, flights, and hotels — all matched to your event dates.",
    icon: Search,
    demo: {
      type: "results",
      items: [
        { icon: Ticket, label: "Lakers vs Celtics", value: "$285" },
        { icon: Plane, label: "SFO → LAX", value: "$127 rt" },
        { icon: Hotel, label: "2 nights downtown", value: "$340" },
      ],
    },
  },
  {
    number: "03",
    title: "book & go",
    description: "One-click links to purchase. We don't take a cut.",
    icon: Check,
    demo: {
      type: "summary",
      trip: {
        event: "Lakers vs Celtics",
        date: "Feb 14",
        total: "$752",
      },
    },
  },
]

// =============================================================================
// Chat Demo Component
// =============================================================================

interface ChatDemoProps {
  messages: { role: string; text: string }[]
  isActive: boolean
}

function ChatDemo({ messages, isActive }: ChatDemoProps) {
  const [visibleMessages, setVisibleMessages] = useState(0)

  useEffect(() => {
    if (!isActive) {
      setVisibleMessages(0)
      return
    }

    const timers: NodeJS.Timeout[] = []
    messages.forEach((_, index) => {
      timers.push(
        setTimeout(() => {
          setVisibleMessages(index + 1)
        }, index * 800 + 300)
      )
    })

    return () => timers.forEach(clearTimeout)
  }, [isActive, messages])

  return (
    <div className="space-y-2">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={cn(
            "transition-all duration-300",
            index < visibleMessages
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-2"
          )}
        >
          <div
            className={cn(
              "px-3 py-2 rounded-xl text-sm max-w-[85%]",
              msg.role === "user"
                ? "bg-primary text-primary-foreground ml-auto"
                : "bg-muted"
            )}
          >
            {msg.text}
          </div>
        </div>
      ))}
    </div>
  )
}

// =============================================================================
// Results Demo Component
// =============================================================================

interface ResultsDemoProps {
  items: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }[]
  isActive: boolean
}

function ResultsDemo({ items, isActive }: ResultsDemoProps) {
  const [visibleItems, setVisibleItems] = useState(0)

  useEffect(() => {
    if (!isActive) {
      setVisibleItems(0)
      return
    }

    const timers: NodeJS.Timeout[] = []
    items.forEach((_, index) => {
      timers.push(
        setTimeout(() => {
          setVisibleItems(index + 1)
        }, index * 400 + 300)
      )
    })

    return () => timers.forEach(clearTimeout)
  }, [isActive, items])

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={index}
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl bg-muted transition-all duration-300",
            index < visibleItems
              ? "opacity-100 translate-x-0"
              : "opacity-0 -translate-x-4"
          )}
        >
          <item.icon className="w-4 h-4 text-muted-foreground" />
          <span className="flex-1 text-sm">{item.label}</span>
          <span className="text-sm font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

// =============================================================================
// Summary Demo Component
// =============================================================================

interface SummaryDemoProps {
  trip: { event: string; date: string; total: string }
  isActive: boolean
}

function SummaryDemo({ trip, isActive }: SummaryDemoProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!isActive) {
      setIsVisible(false)
      return
    }

    const timer = setTimeout(() => setIsVisible(true), 300)
    return () => clearTimeout(timer)
  }, [isActive])

  return (
    <div
      className={cn(
        "p-4 rounded-xl bg-primary text-primary-foreground transition-all duration-500",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <Check className="w-4 h-4" />
        <span className="text-sm font-medium">trip ready</span>
      </div>
      <div className="text-lg font-semibold">{trip.event}</div>
      <div className="flex items-center justify-between mt-2 text-sm opacity-90">
        <span>{trip.date}</span>
        <span className="font-medium">{trip.total} total</span>
      </div>
    </div>
  )
}

// =============================================================================
// Main How It Works Component
// =============================================================================

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0)
  const [isInView, setIsInView] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  // Intersection observer to trigger animations when in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
        }
      },
      { threshold: 0.3 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Auto-cycle through steps
  useEffect(() => {
    if (!isInView) return

    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % STEPS.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [isInView])

  return (
    <section ref={sectionRef} className="py-12 sm:py-20">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3 lowercase">how it works</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            From idea to itinerary in minutes
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
          {/* Left: Step List */}
          <div className="space-y-4 sm:space-y-6 order-2 md:order-1">
            {STEPS.map((step, index) => (
              <button
                key={index}
                onClick={() => setActiveStep(index)}
                className={cn(
                  "w-full text-left p-3 sm:p-4 rounded-2xl transition-all duration-300 active:scale-[0.98]",
                  activeStep === index
                    ? "bg-muted"
                    : "hover:bg-muted/50"
                )}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Step Number */}
                  <div
                    className={cn(
                      "w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-colors duration-300 flex-shrink-0",
                      activeStep === index
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted-foreground/10 text-muted-foreground"
                    )}
                  >
                    {step.number}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm sm:text-base mb-0.5 sm:mb-1 lowercase">{step.title}</h3>
                    <p
                      className={cn(
                        "text-xs sm:text-sm transition-all duration-300",
                        activeStep === index
                          ? "text-muted-foreground"
                          : "text-muted-foreground/60"
                      )}
                    >
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ArrowRight
                    className={cn(
                      "w-4 h-4 mt-0.5 transition-all duration-300 flex-shrink-0 hidden sm:block",
                      activeStep === index
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 -translate-x-2"
                    )}
                  />
                </div>
              </button>
            ))}
          </div>

          {/* Right: Demo Preview */}
          <div className="relative order-1 md:order-2">
            <div className="bg-card border rounded-2xl p-5 sm:p-6 min-h-[200px] sm:min-h-[280px] flex flex-col justify-center">
              {/* Chat Demo */}
              {activeStep === 0 && (
                <ChatDemo
                  messages={STEPS[0].demo.messages!}
                  isActive={activeStep === 0}
                />
              )}

              {/* Results Demo */}
              {activeStep === 1 && (
                <ResultsDemo
                  items={STEPS[1].demo.items as ResultsDemoProps['items']}
                  isActive={activeStep === 1}
                />
              )}

              {/* Summary Demo */}
              {activeStep === 2 && (
                <SummaryDemo
                  trip={STEPS[2].demo.trip!}
                  isActive={activeStep === 2}
                />
              )}
            </div>

            {/* Progress Dots */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {STEPS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveStep(index)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    activeStep === index
                      ? "w-8 bg-primary"
                      : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// =============================================================================
// Compact Version (for smaller spaces)
// =============================================================================

export function HowItWorksCompact() {
  return (
    <section className="py-12 sm:py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-center text-lg sm:text-xl font-semibold mb-8 sm:mb-12 lowercase">how it works</h2>

        <div className="grid grid-cols-3 gap-4 sm:gap-8">
          {STEPS.map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <step.icon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-xs sm:text-sm mb-1 lowercase">{step.title}</h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// =============================================================================
// Inline Version (horizontal, minimal)
// =============================================================================

export function HowItWorksInline() {
  return (
    <div className="flex items-center justify-center gap-4 sm:gap-8 py-6 sm:py-8 text-xs sm:text-sm text-muted-foreground">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-muted flex items-center justify-center text-[10px] sm:text-xs font-medium">1</span>
        <span className="hidden sm:inline">tell us the event</span>
        <span className="sm:hidden">event</span>
      </div>
      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-muted flex items-center justify-center text-[10px] sm:text-xs font-medium">2</span>
        <span className="hidden sm:inline">we find everything</span>
        <span className="sm:hidden">search</span>
      </div>
      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-muted flex items-center justify-center text-[10px] sm:text-xs font-medium">3</span>
        <span className="hidden sm:inline">book & go</span>
        <span className="sm:hidden">book</span>
      </div>
    </div>
  )
}
