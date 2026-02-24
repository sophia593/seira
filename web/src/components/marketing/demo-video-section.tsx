'use client'

import { useState } from 'react'
import { Play } from 'lucide-react'

interface DemoVideoSectionProps {
  /** YouTube/Vimeo embed URL or self-hosted video src */
  videoSrc: string
  /** Controls render strategy */
  videoType?: 'youtube' | 'vimeo' | 'self-hosted'
  /** Thumbnail for click-to-play overlay */
  posterSrc?: string
}

export function DemoVideoSection({
  videoSrc,
  videoType = 'youtube',
  posterSrc,
}: DemoVideoSectionProps) {
  const [playing, setPlaying] = useState(false)

  return (
    <section className="bg-background py-20 sm:py-28 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14 animate-fade-in-up">
          <p className="text-xs uppercase tracking-widest text-copper mb-2">
            see it in action
          </p>
          <h2 className="text-2xl sm:text-3xl font-semibold lowercase">
            watch how seira works
          </h2>
          <p className="text-sm text-muted-foreground mt-3 max-w-lg mx-auto">
            a quick walkthrough of deliverable tracking, proof collection,
            and recap generation — from setup to send.
          </p>
        </div>

        {/* Video container */}
        <div className="animate-fade-in-up animation-delay-200">
          <div className="aspect-[16/10] rounded-2xl border border-border shadow-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-50">
            {videoType === 'self-hosted' ? (
              <video
                className="w-full h-full object-cover"
                src={videoSrc}
                poster={posterSrc}
                controls
                playsInline
                preload="metadata"
              />
            ) : !playing && posterSrc ? (
              <button
                type="button"
                onClick={() => setPlaying(true)}
                className="relative w-full h-full group"
                aria-label="Play demo video"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={posterSrc}
                  alt="Demo video thumbnail"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-kurobeni/30 group-hover:bg-kurobeni/40 transition-colors">
                  <div className="w-16 h-16 rounded-full bg-copper flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <Play className="w-7 h-7 text-white ml-1" />
                  </div>
                </div>
              </button>
            ) : (
              <iframe
                src={`${videoSrc}${videoSrc.includes('?') ? '&' : '?'}autoplay=${playing ? 1 : 0}&rel=0`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Seira product walkthrough"
                loading="lazy"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
