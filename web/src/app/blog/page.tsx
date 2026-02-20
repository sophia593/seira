import Link from 'next/link'
import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { getAllPosts } from '@/lib/blog'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'blog',
  description:
    'Insights, guides, and updates for sponsorship teams in live entertainment.',
  openGraph: {
    title: 'Blog — Seira',
    description:
      'Insights, guides, and updates for sponsorship teams in live entertainment.',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function BlogPage() {
  const posts = getAllPosts()

  return (
    <main className="min-h-screen bg-background">
      <MarketingNav variant="light" />

      {/* Hero */}
      <section className="pt-12 pb-4 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs uppercase tracking-widest text-copper mb-2">
            blog
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold lowercase">
            insights for sponsorship teams
          </h1>
          <p className="text-base text-muted-foreground mt-3 max-w-lg mx-auto">
            guides, best practices, and updates from the seira team.
          </p>
        </div>
      </section>

      {/* Post list */}
      <section className="py-12 sm:py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-8">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="group rounded-2xl border border-border bg-card p-6 sm:p-8 hover:shadow-md transition-shadow"
            >
              <p className="text-xs text-muted-foreground mb-2">
                {formatDate(post.date)} · {post.author}
              </p>
              <Link href={`/blog/${post.slug}`}>
                <h2 className="text-xl font-semibold lowercase group-hover:text-copper transition-colors">
                  {post.title.toLowerCase()}
                </h2>
              </Link>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {post.excerpt}
              </p>
              <Link
                href={`/blog/${post.slug}`}
                className="inline-block text-sm font-medium text-copper mt-3 hover:underline lowercase"
              >
                read more
              </Link>
            </article>
          ))}

          {posts.length === 0 && (
            <p className="text-center text-muted-foreground py-20">
              No posts yet. Check back soon.
            </p>
          )}
        </div>
      </section>

      <MarketingFooter />
    </main>
  )
}
