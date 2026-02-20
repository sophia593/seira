import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { getAllPosts, getPostBySlug } from '@/lib/blog'
import type { Metadata } from 'next'

// ---------------------------------------------------------------------------
// Static generation
// ---------------------------------------------------------------------------

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts = getAllPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) return { title: 'Post Not Found' }

  return {
    title: post.title.toLowerCase(),
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
    },
    twitter: { card: 'summary_large_image' },
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  if (!post) notFound()

  return (
    <main className="min-h-screen bg-background">
      <MarketingNav variant="light" />

      <article className="max-w-3xl mx-auto px-4 py-12 sm:py-16">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          back to blog
        </Link>

        {/* Header */}
        <header className="mb-10">
          <h1 className="text-2xl sm:text-4xl font-bold lowercase leading-tight">
            {post.title.toLowerCase()}
          </h1>
          <p className="text-sm text-muted-foreground mt-3">
            {formatDate(post.date)} · {post.author}
          </p>
        </header>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {post.content}
          </ReactMarkdown>
        </div>

        {/* Footer */}
        <div className="border-t border-border mt-16 pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link
            href="/blog"
            className="text-sm font-medium text-copper hover:underline lowercase"
          >
            ← all posts
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center h-9 px-4 rounded-xl bg-copper text-white text-sm font-semibold lowercase hover:bg-copper/90 transition-colors"
          >
            try seira free
          </Link>
        </div>
      </article>

      <MarketingFooter />
    </main>
  )
}
