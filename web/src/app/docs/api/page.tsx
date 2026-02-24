import { MarketingNav } from '@/components/marketing/marketing-nav'
import { MarketingFooter } from '@/components/marketing/marketing-footer'

// ---------------------------------------------------------------------------
// Endpoint definitions
// ---------------------------------------------------------------------------

const ENDPOINTS = [
  {
    method: 'GET',
    path: '/api/v1/events',
    description: 'List events for your organization.',
    params: [
      { name: 'status', type: 'string', description: 'Filter by event status (e.g. upcoming, completed)' },
      { name: 'season_id', type: 'uuid', description: 'Filter by season' },
    ],
    order: 'date descending',
    example: {
      curl: `curl -H "Authorization: Bearer sk_live_..." \\
  "https://app.seira.com/api/v1/events?status=upcoming&limit=10"`,
      response: `{
  "data": [
    {
      "id": "e1a2b3c4-...",
      "name": "Summer Festival 2025",
      "date": "2025-07-15",
      "venue": "Central Park",
      "status": "upcoming",
      "season_id": "s9d8e7f6-...",
      "created_at": "2025-01-10T12:00:00Z",
      "updated_at": "2025-01-10T12:00:00Z"
    }
  ],
  "meta": { "total": 1, "limit": 10, "offset": 0 }
}`,
    },
  },
  {
    method: 'GET',
    path: '/api/v1/partners',
    description: 'List partners (sponsors) across your events.',
    params: [
      { name: 'event_id', type: 'uuid', description: 'Filter by event' },
    ],
    order: 'name ascending',
    example: {
      curl: `curl -H "Authorization: Bearer sk_live_..." \\
  "https://app.seira.com/api/v1/partners?event_id=e1a2b3c4-..."`,
      response: `{
  "data": [
    {
      "id": "p5f6a7b8-...",
      "event_id": "e1a2b3c4-...",
      "name": "Acme Corp",
      "contact_name": "Jane Doe",
      "contact_email": "jane@acme.com",
      "deal_value": 25000,
      "created_at": "2025-01-12T09:00:00Z",
      "updated_at": "2025-01-12T09:00:00Z"
    }
  ],
  "meta": { "total": 1, "limit": 50, "offset": 0 }
}`,
    },
  },
  {
    method: 'GET',
    path: '/api/v1/deliverables',
    description: 'List deliverables across all events and partners.',
    params: [
      { name: 'event_id', type: 'uuid', description: 'Filter by event' },
      { name: 'partner_id', type: 'uuid', description: 'Filter by partner' },
      { name: 'status', type: 'string', description: 'Filter by status (e.g. todo, in_progress, done, proved)' },
      { name: 'category', type: 'string', description: 'Filter by category (e.g. signage, digital, hospitality)' },
    ],
    order: 'created_at descending',
    example: {
      curl: `curl -H "Authorization: Bearer sk_live_..." \\
  "https://app.seira.com/api/v1/deliverables?status=done&limit=5"`,
      response: `{
  "data": [
    {
      "id": "d9c8b7a6-...",
      "partner_id": "p5f6a7b8-...",
      "event_id": "e1a2b3c4-...",
      "title": "Main stage banner",
      "category": "signage",
      "status": "done",
      "due_date": "2025-07-14",
      "proof_required": true,
      "created_at": "2025-01-15T14:00:00Z",
      "updated_at": "2025-06-20T10:30:00Z"
    }
  ],
  "meta": { "total": 1, "limit": 5, "offset": 0 }
}`,
    },
  },
  {
    method: 'GET',
    path: '/api/v1/recaps',
    description: 'List recap reports.',
    params: [
      { name: 'event_id', type: 'uuid', description: 'Filter by event' },
      { name: 'partner_id', type: 'uuid', description: 'Filter by partner' },
      { name: 'status', type: 'string', description: 'Filter by status (draft, published)' },
      { name: 'season_id', type: 'uuid', description: 'Filter by season' },
    ],
    order: 'created_at descending',
    example: {
      curl: `curl -H "Authorization: Bearer sk_live_..." \\
  "https://app.seira.com/api/v1/recaps?status=published"`,
      response: `{
  "data": [
    {
      "id": "r2d3e4f5-...",
      "event_id": "e1a2b3c4-...",
      "partner_id": "p5f6a7b8-...",
      "title": "Acme Corp — Summer Festival Recap",
      "status": "published",
      "share_token": "abc123def456",
      "published_at": "2025-08-01T16:00:00Z",
      "created_at": "2025-07-20T11:00:00Z",
      "updated_at": "2025-08-01T16:00:00Z"
    }
  ],
  "meta": { "total": 1, "limit": 50, "offset": 0 }
}`,
    },
  },
]

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="rounded-xl bg-gray-950 text-gray-100 text-sm leading-relaxed p-4 overflow-x-auto">
      <code>{children}</code>
    </pre>
  )
}

function ParamTable({ params }: { params: { name: string; type: string; description: string }[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left">
            <th className="py-2 pr-4 font-medium text-muted-foreground">Parameter</th>
            <th className="py-2 pr-4 font-medium text-muted-foreground">Type</th>
            <th className="py-2 font-medium text-muted-foreground">Description</th>
          </tr>
        </thead>
        <tbody>
          {params.map((p) => (
            <tr key={p.name} className="border-b border-border/50">
              <td className="py-2 pr-4">
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{p.name}</code>
              </td>
              <td className="py-2 pr-4 text-muted-foreground">{p.type}</td>
              <td className="py-2 text-muted-foreground">{p.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-background">
      <MarketingNav variant="light" />

      {/* Header */}
      <section className="pt-12 pb-4 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs uppercase tracking-widest text-copper mb-2">
            developers
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold lowercase">
            API reference
          </h1>
          <p className="text-base text-muted-foreground mt-3 max-w-lg mx-auto">
            read-only REST API for pulling your events, partners, deliverables,
            and recaps into external tools and dashboards.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-12 sm:py-16 px-6">
        <div className="max-w-3xl mx-auto space-y-16">

          {/* Authentication */}
          <div>
            <h2 className="text-xl font-semibold lowercase mb-3">authentication</h2>
            <p className="text-sm text-muted-foreground mb-4">
              All requests require a Bearer token in the Authorization header.
              Generate API keys from <strong>Settings &rarr; Integrations</strong> in your Seira dashboard.
            </p>
            <CodeBlock>{`Authorization: Bearer sk_live_aBcDeFgHiJkLmNoPqRsT...`}</CodeBlock>
            <p className="text-xs text-muted-foreground mt-2">
              Keys are scoped to your organization. Keep them secret — treat them like passwords.
            </p>
          </div>

          {/* Base URL */}
          <div>
            <h2 className="text-xl font-semibold lowercase mb-3">base URL</h2>
            <CodeBlock>{`https://app.seira.com/api/v1`}</CodeBlock>
          </div>

          {/* Pagination */}
          <div>
            <h2 className="text-xl font-semibold lowercase mb-3">pagination</h2>
            <p className="text-sm text-muted-foreground mb-4">
              All list endpoints support pagination with <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">limit</code> and <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">offset</code> query parameters.
            </p>
            <ParamTable
              params={[
                { name: 'limit', type: 'integer', description: 'Number of results to return (default: 50, max: 200)' },
                { name: 'offset', type: 'integer', description: 'Number of results to skip (default: 0)' },
              ]}
            />
            <p className="text-sm text-muted-foreground mt-4 mb-2">
              Every response includes a <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">meta</code> object:
            </p>
            <CodeBlock>{`{
  "data": [ ... ],
  "meta": {
    "total": 142,
    "limit": 50,
    "offset": 0
  }
}`}</CodeBlock>
          </div>

          {/* Errors */}
          <div>
            <h2 className="text-xl font-semibold lowercase mb-3">errors</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Errors return a JSON object with an <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">error</code> field.
            </p>
            <CodeBlock>{`{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or revoked API key"
  }
}`}</CodeBlock>
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 pr-4 font-medium text-muted-foreground">Status</th>
                    <th className="py-2 font-medium text-muted-foreground">Meaning</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4"><code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">401</code></td>
                    <td className="py-2 text-muted-foreground">Missing, invalid, or revoked API key</td>
                  </tr>
                  <tr className="border-b border-border/50">
                    <td className="py-2 pr-4"><code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">500</code></td>
                    <td className="py-2 text-muted-foreground">Internal server error</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Endpoints */}
          <div>
            <h2 className="text-xl font-semibold lowercase mb-6">endpoints</h2>
            <div className="space-y-12">
              {ENDPOINTS.map((ep) => (
                <div key={ep.path} className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 uppercase">
                      {ep.method}
                    </span>
                    <code className="text-sm font-mono font-medium">{ep.path}</code>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">{ep.description}</p>

                  {ep.params.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">query parameters</p>
                      <ParamTable params={ep.params} />
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mb-1">
                    Default order: <code className="rounded bg-muted px-1 py-0.5 text-xs font-mono">{ep.order}</code>
                  </p>

                  <div className="mt-4 space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">example request</p>
                      <CodeBlock>{ep.example.curl}</CodeBlock>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">example response</p>
                      <CodeBlock>{ep.example.response}</CodeBlock>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rate limits */}
          <div>
            <h2 className="text-xl font-semibold lowercase mb-3">rate limits</h2>
            <p className="text-sm text-muted-foreground">
              No rate limits are currently enforced. We reserve the right to introduce limits in the future.
              Please be respectful and avoid excessive polling.
            </p>
          </div>

        </div>
      </section>

      <MarketingFooter />
    </main>
  )
}
