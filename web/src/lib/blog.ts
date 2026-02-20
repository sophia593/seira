import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BlogPost {
  slug: string
  title: string
  date: string
  excerpt: string
  author: string
  content: string
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')

// ---------------------------------------------------------------------------
// Read helpers
// ---------------------------------------------------------------------------

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return []

  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'))

  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8')
    const { data, content } = matter(raw)
    const slug = data.slug ?? file.replace(/\.md$/, '')

    return {
      slug,
      title: data.title ?? 'Untitled',
      date: data.date ? String(data.date) : '',
      excerpt: data.excerpt ?? '',
      author: data.author ?? 'Seira Team',
      content,
    } satisfies BlogPost
  })

  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )
}

export function getPostBySlug(slug: string): BlogPost | null {
  const posts = getAllPosts()
  return posts.find((p) => p.slug === slug) ?? null
}
