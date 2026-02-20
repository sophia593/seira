import Link from 'next/link'
import { ProductPreview } from './product-preview'

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-b from-kurobeni to-blackberry overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 pt-32 pb-24 sm:pt-40 sm:pb-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Copy */}
          <div>
            <p className="text-xs sm:text-sm uppercase tracking-widest text-copper animate-fade-in-up">
              commercial ops for live entertainment
            </p>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mt-4 lowercase leading-tight animate-fade-in-up animation-delay-100">
              every deliverable.
              <br className="hidden sm:block" />
              {' '}every proof.
              <br className="hidden sm:block" />
              {' '}every partner.
            </h1>
            <p className="text-base sm:text-lg text-white/60 mt-6 max-w-lg animate-fade-in-up animation-delay-200">
              seira is the fulfillment platform for sponsorship teams.
              track deliverables, collect proof of performance, and send
              recap reports your partners actually want to read.
            </p>
            <div className="flex items-center gap-4 mt-8 animate-fade-in-up animation-delay-300">
              <Link
                href="/signup"
                className="inline-flex items-center h-11 px-6 rounded-xl bg-copper text-white text-sm font-semibold lowercase hover:bg-copper/90 transition-colors"
              >
                get started free
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium text-white/50 hover:text-white transition-colors lowercase"
              >
                or log in
              </Link>
            </div>
          </div>

          {/* Product preview */}
          <div className="animate-fade-in-up animation-delay-400">
            <ProductPreview />
          </div>
        </div>
      </div>
    </section>
  )
}
