import {
  CalendarDays,
  FileText,
  Camera,
  BookOpen,
  Users,
  ChevronRight,
  Zap,
  Upload,
  Share2,
  Shield,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Article data
// ---------------------------------------------------------------------------

const ARTICLES = [
  {
    id: 'getting-started',
    icon: CalendarDays,
    title: 'Getting Started',
    summary: 'Create events, add partners, and track your first deliverables.',
    sections: [
      {
        heading: 'Create an event',
        body: 'An event is any activation where sponsors have deliverables — a game, concert, festival, conference, or gala. Head to the Events page and click "+ new event." Give it a name, optionally set a date and venue, and you\'re ready to go.',
      },
      {
        heading: 'Add partners',
        body: 'From an event detail page, click "Add Partner." Enter the sponsor\'s name, deal summary, and contact info. If you have templates set up, pick one to pre-fill deliverables automatically — or add them manually one by one.',
      },
      {
        heading: 'Track deliverables',
        body: 'Each deliverable represents a single obligation to a sponsor: an LED board read, a social post, a suite visit, etc. Deliverables move through a status flow: Not Started → In Progress → Done → Proved. Update status as work gets completed.',
      },
      {
        heading: 'Use Game Day mode',
        body: 'On event day, the Game Day button lets you quickly mark all deliverables in a category (e.g., all in-venue items) as done in one click — saving time when you\'re running around the venue.',
      },
      {
        heading: 'Organize with seasons',
        body: 'Seasons let you group related events (a basketball season, a concert series, a festival weekend) to see combined stats, utilization, and partner rollups across the full run.',
      },
    ],
  },
  {
    id: 'templates',
    icon: FileText,
    title: 'Templates',
    summary: 'Save time with reusable deliverable packages.',
    sections: [
      {
        heading: 'What are templates?',
        body: 'A template is a pre-built set of deliverables that you can apply to any partner in one click. Instead of adding the same 12 deliverables every time you onboard a Gold sponsor, create a "Gold Package" template once and reuse it.',
      },
      {
        heading: 'Create a template',
        body: 'Go to Settings → Templates and click "Create template." Name it, optionally tag an industry, and add deliverables with their title, category, and proof type. You can also duplicate an existing template as a starting point.',
      },
      {
        heading: 'Apply a template',
        body: 'When adding a partner to an event, you\'ll see your templates listed in the "Start from template" section. Click one to pre-fill the deliverables list. You can still edit, add, or remove individual items before saving.',
      },
      {
        heading: 'Global vs. org templates',
        body: 'Global templates (provided by Seira) are available to all organizations and are a great starting point. Org templates are ones you create — they\'re private to your workspace. You can duplicate a global template into your org to customize it.',
      },
      {
        heading: 'Sharing templates',
        body: 'Generate a share link for any org template to let partners or colleagues preview the deliverable package. Share links are read-only and can be revoked at any time from the template settings.',
      },
    ],
  },
  {
    id: 'proof',
    icon: Camera,
    title: 'Proof Collection',
    summary: 'Upload and manage proof of fulfillment for every deliverable.',
    sections: [
      {
        heading: 'Why collect proof?',
        body: 'Proof is the documentation that a deliverable was actually fulfilled — a photo of the LED board, a screenshot of the social post, a link to the published article. Collecting proof builds trust with sponsors, simplifies renewals, and powers your recap reports.',
      },
      {
        heading: 'Proof types',
        body: 'Each deliverable specifies what kind of proof is expected: Photo (camera capture or image upload), Screenshot (screen grab of a digital deliverable), File (PDF, document, or other attachment), Link (URL to a live post or page), or Multiple (any combination of the above).',
      },
      {
        heading: 'Uploading proof',
        body: 'On the deliverable detail page, click "Upload proof" or "Add link." Photos and files are uploaded directly — drag and drop or click to browse. For link-type proof, paste the URL. Proof thumbnails appear immediately after upload.',
      },
      {
        heading: 'Approval workflow',
        body: 'For categories that require admin approval (configured in Settings → Approval), uploading proof moves the deliverable to "Pending Approval" instead of "Proved." An admin then reviews and approves or rejects with a note. This is useful for talent content that needs brand compliance review.',
      },
      {
        heading: 'Proof progress tracking',
        body: 'The proof collection bar on event and partner pages shows how many deliverables have been verified. When all deliverables are proved, you\'ll see "All proof collected" — meaning the event is recap-ready.',
      },
    ],
  },
  {
    id: 'recaps',
    icon: BookOpen,
    title: 'Recap Reports',
    summary: 'Generate shareable proof-of-performance summaries for sponsors.',
    sections: [
      {
        heading: 'What is a recap?',
        body: 'A recap is a professional proof-of-performance report that you send to a sponsor after an event. It lists all their deliverables with status, attached proof photos, and an optional cover note — everything they need to see that their investment was fulfilled.',
      },
      {
        heading: 'Generate a recap',
        body: 'From a partner\'s detail page, scroll to the Recaps section and click "Generate Recap." Seira compiles all proved deliverables with their proof into a polished report. You can add a cover note (or let AI write one) before publishing.',
      },
      {
        heading: 'Draft vs. published',
        body: 'New recaps start as drafts, visible only to your team. Review the content, edit the cover note, and when you\'re satisfied, publish it. Publishing generates a shareable public link that anyone can view without logging in.',
      },
      {
        heading: 'Sharing with sponsors',
        body: 'Once published, click the share link to copy it or email it directly to the partner\'s contact. The public recap page is branded, mobile-friendly, and includes all proof thumbnails. Sponsors love receiving these — it makes renewal conversations easy.',
      },
      {
        heading: 'Season and combined recaps',
        body: 'For sponsors active across multiple events, you can generate a combined or season recap that rolls up deliverables from every event into a single comprehensive report. This is great for end-of-season summary meetings.',
      },
    ],
  },
  {
    id: 'team',
    icon: Users,
    title: 'Team & Permissions',
    summary: 'Invite teammates and manage who can do what.',
    sections: [
      {
        heading: 'Invite team members',
        body: 'Go to Settings → Team and click "Invite member." Enter their email and choose a role. They\'ll receive an invitation email with a link to join your workspace. You can also copy the invite link to send manually.',
      },
      {
        heading: 'Roles explained',
        body: 'Owner: Full access including billing, workspace deletion, and ownership transfer. One owner per workspace.\nAdmin: Can manage events, partners, deliverables, templates, talent, assets, and team members. Can approve proof and publish recaps.\nContributor: Can create and edit events, partners, and deliverables. Can upload proof. Cannot manage team, templates, or approval settings.\nViewer: Read-only access to all data. Useful for executives or external stakeholders who need visibility without edit access.',
      },
      {
        heading: 'Approval permissions',
        body: 'Only Owners and Admins can approve or reject deliverables in the "Pending Approval" status. Contributors can upload proof but cannot approve it. Configure which categories require approval in Settings → Approval.',
      },
      {
        heading: 'Workspace settings',
        body: 'Owners and Admins can rename the workspace, manage approval categories, and configure templates. These settings apply to the entire organization and affect all members.',
      },
      {
        heading: 'Switching workspaces',
        body: 'If you belong to multiple organizations, use the workspace switcher at the bottom of the sidebar to switch between them. Each workspace has its own events, partners, templates, and team.',
      },
    ],
  },
] as const

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const ICON_COLORS: Record<string, { bg: string; text: string }> = {
  'getting-started': { bg: 'bg-blue-50', text: 'text-blue-600' },
  templates: { bg: 'bg-purple-50', text: 'text-purple-600' },
  proof: { bg: 'bg-amber-50', text: 'text-amber-600' },
  recaps: { bg: 'bg-green-50', text: 'text-green-600' },
  team: { bg: 'bg-rose-50', text: 'text-rose-600' },
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function HelpPage() {
  return (
    <div className="px-4 py-6 md:px-8 md:py-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Help</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Learn how to get the most out of Seira.
        </p>
      </div>

      {/* Article cards */}
      <div className="space-y-4 mb-10">
        {ARTICLES.map((article) => {
          const colors = ICON_COLORS[article.id] ?? { bg: 'bg-gray-50', text: 'text-gray-600' }
          return (
            <a
              key={article.id}
              href={`#${article.id}`}
              className="flex items-center gap-4 rounded-lg border border-gray-200 px-4 py-3.5 hover:border-gray-300 hover:bg-gray-50/50 transition-colors"
            >
              <div className={`w-9 h-9 rounded-lg ${colors.bg} flex items-center justify-center shrink-0`}>
                <article.icon className={`w-4.5 h-4.5 ${colors.text}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{article.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{article.summary}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            </a>
          )
        })}
      </div>

      {/* Full articles */}
      {ARTICLES.map((article) => {
        const colors = ICON_COLORS[article.id] ?? { bg: 'bg-gray-50', text: 'text-gray-600' }
        return (
          <article key={article.id} id={article.id} className="scroll-mt-8 mb-12">
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center shrink-0`}>
                <article.icon className={`w-4 h-4 ${colors.text}`} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">{article.title}</h2>
            </div>

            <div className="space-y-5 pl-11">
              {article.sections.map((section, i) => (
                <div key={i}>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">{section.heading}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {section.body}
                  </p>
                </div>
              ))}
            </div>
          </article>
        )
      })}

      {/* Footer */}
      <div className="border-t border-gray-100 pt-6 mt-6">
        <p className="text-xs text-muted-foreground">
          Need more help? Reach out to your workspace admin or contact us at{' '}
          <a href="mailto:support@seira.app" className="underline hover:text-foreground transition-colors">
            support@seira.app
          </a>
        </p>
      </div>
    </div>
  )
}
