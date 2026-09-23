import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Bell, Calendar, Search, Users } from 'lucide-react'
import {
  Avatar,
  Badge,
  Button,
  Card,
  CountBadge,
  EmptyState,
  Field,
  Input,
  ListRow,
  SegmentedControl,
  Sheet,
  Skeleton,
  SkeletonText,
  Spinner,
  Textarea,
  useToast,
} from '#/components/ui'
import type { ButtonVariant } from '#/components/ui'

export const Route = createFileRoute('/design')({ component: DesignKitPage })

const TYPE_SCALE = [
  ['text-display', 'Display · 34/650'],
  ['text-h1', 'Heading 1 · 28/650'],
  ['text-h2', 'Heading 2 · 22/650'],
  ['text-h3', 'Heading 3 · 18/650'],
  ['text-title', 'Title · 16/600'],
  ['text-lead', 'Lead · 17/300'],
  ['text-body', 'Body · 15/450'],
  ['text-body-sm', 'Body small · 13/450'],
  ['text-link', 'Link · 15/600'],
  ['text-label', 'Label · 11/600'],
  ['text-caption', 'Caption · 11/450'],
] as const

const SWATCHES = [
  ['bg-canvas', 'canvas'],
  ['bg-canvas-raised', 'canvas-raised'],
  ['bg-canvas-soft', 'canvas-soft'],
  ['bg-field', 'field'],
  ['bg-hairline', 'hairline'],
  ['bg-ink-faint', 'ink-faint'],
  ['bg-ink-muted', 'ink-muted'],
  ['bg-ink', 'ink'],
  ['bg-accent', 'accent'],
  ['bg-danger', 'danger'],
  ['bg-success', 'success'],
  ['bg-warning', 'warning'],
] as const

const BUTTON_VARIANTS: ReadonlyArray<ButtonVariant> = [
  'primary',
  'outline',
  'soft',
  'ghost',
  'danger',
]

function DesignKitPage() {
  const [tab, setTab] = useState<'one' | 'two' | 'three'>('one')
  const [sheetOpen, setSheetOpen] = useState(false)
  const [text, setText] = useState('')
  const { toast } = useToast()

  if (!import.meta.env.DEV) {
    return (
      <div className="page-wrap py-16">
        <EmptyState title="Not available" description="The design kit only renders in development." />
      </div>
    )
  }

  return (
    <div className="page-wrap space-y-10 py-6 pb-28">
      <header>
        <h1 className="text-h1 text-ink">Design kit</h1>
        <p className="mt-1 text-body-sm text-ink-muted">
          Every primitive in <code className="text-ink">components/ui</code>, on the Mobbin
          ladder from DESIGN.md.
        </p>
      </header>

      <Section title="Type">
        <div className="space-y-3">
          {TYPE_SCALE.map(([cls, label]) => (
            <div key={cls}>
              <p className="text-caption text-ink-faint">{label}</p>
              <p className={`${cls} text-ink`}>Meet people where you already are.</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Palette">
        <div className="grid grid-cols-4 gap-2">
          {SWATCHES.map(([cls, name]) => (
            <div key={name}>
              <div className={`${cls} h-12 w-full rounded-media border border-hairline-soft`} />
              <p className="mt-1 text-caption text-ink-muted">{name}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Buttons">
        <div className="space-y-4">
          {BUTTON_VARIANTS.map((variant) => (
            <div key={variant} className="flex flex-wrap items-center gap-2">
              <Button variant={variant} size="sm">{variant} sm</Button>
              <Button variant={variant}>{variant} md</Button>
              <Button variant={variant} size="lg">lg</Button>
              <Button variant={variant} icon aria-label="Notifications">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant={variant} disabled>disabled</Button>
            </div>
          ))}
          <Button loading block>Loading</Button>
          <div className="relative h-24 overflow-hidden rounded-card bg-ink">
            <div className="absolute inset-0 flex items-center justify-center gap-2">
              <Button variant="scrim">scrim</Button>
              <Button variant="scrim" icon aria-label="Search">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Section>

      <Section title="Cards">
        <div className="space-y-3">
          <Card>
            <p className="text-title text-ink">plain</p>
            <p className="mt-1 text-body-sm text-ink-muted">Canvas fill, hairline edge.</p>
          </Card>
          <Card variant="soft">
            <p className="text-title text-ink">soft</p>
            <p className="mt-1 text-body-sm text-ink-muted">Tint fill, borderless.</p>
          </Card>
          <Card variant="inverse">
            <p className="text-title">inverse</p>
            <p className="mt-1 text-body-sm opacity-70">Polarity flip.</p>
          </Card>
          <Card variant="dashed">
            <p className="text-title text-ink">dashed</p>
          </Card>
        </div>
      </Section>

      <Section title="Segmented control">
        <SegmentedControl
          aria-label="Example"
          value={tab}
          onChange={setTab}
          segments={[
            { value: 'one', label: 'Friends', count: 12 },
            { value: 'two', label: 'Requests', count: 3 },
            { value: 'three', label: 'Find' },
          ]}
        />
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>neutral</Badge>
          <Badge tone="ink">ink</Badge>
          <Badge tone="accent">accent</Badge>
          <Badge tone="danger">danger</Badge>
          <Badge tone="success">success</Badge>
          <CountBadge count={5} />
          <CountBadge count={140} tone="ink" />
        </div>
      </Section>

      <Section title="Avatars">
        <div className="flex flex-wrap items-end gap-3">
          <Avatar size="xs" />
          <Avatar size="sm" online />
          <Avatar size="md" online={false} />
          <Avatar size="lg" square />
          <Avatar size="xl" obscured />
        </div>
      </Section>

      <Section title="Fields">
        <div className="space-y-4">
          <Field label="Name" hint="Shown on your profile.">
            {({ id, describedBy }) => (
              <Input id={id} aria-describedby={describedBy} placeholder="Ada" />
            )}
          </Field>
          <Field label="Search" >
            {({ id }) => (
              <Input id={id} placeholder="Find people" leading={<Search />} />
            )}
          </Field>
          <Field
            label="Bio"
            error="Bio must be under 300 characters."
            aside={`${text.length}/300`}
          >
            {({ id, invalid, describedBy }) => (
              <Textarea
                id={id}
                invalid={invalid}
                aria-describedby={describedBy}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Tell people what you're into"
              />
            )}
          </Field>
        </div>
      </Section>

      <Section title="List rows">
        <div>
          <ListRow
            leading={<Avatar size="lg" online />}
            title="Priya"
            subtitle="Sent you a friend request"
            trailing={<CountBadge count={2} />}
            emphasis
          />
          <ListRow
            leading={<Avatar size="lg" />}
            title="Marcus"
            subtitle="See you there"
            chevron
          />
          <ListRow title="Blocked accounts" chevron as="button" onClick={() => {}} />
          <ListRow title="Delete account" danger as="button" onClick={() => {}} />
        </div>
      </Section>

      <Section title="Empty state">
        <EmptyState
          icon={Users}
          title="No requests yet"
          description="When someone asks to connect, they'll show up here."
          action={<Button>Find people</Button>}
        />
      </Section>

      <Section title="Loading">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-14 w-14 rounded-full" />
            <SkeletonText className="flex-1" lines={2} />
          </div>
          <Skeleton className="h-40 w-full rounded-card" />
          <div className="flex items-center gap-2 text-ink-muted">
            <Spinner /> <span className="text-body-sm">Spinner</span>
          </div>
        </div>
      </Section>

      <Section title="Overlays">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setSheetOpen(true)}>Open sheet</Button>
          <Button variant="outline" onClick={() => toast('Saved to your profile', { tone: 'success' })}>
            Success toast
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast('Could not send that message.', {
                tone: 'error',
                action: { label: 'Retry', onClick: () => toast('Retrying…') },
              })
            }
          >
            Error toast
          </Button>
        </div>
        <Sheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title="Leave this event?"
          description="You'll stop appearing to other attendees, and lose access to the event chat."
          footer={
            <>
              <Button variant="outline" block onClick={() => setSheetOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" block onClick={() => setSheetOpen(false)}>
                Leave
              </Button>
            </>
          }
        >
          <Card variant="soft" className="flex items-center gap-3">
            <Calendar className="h-5 w-5 shrink-0 text-ink-muted" />
            <div className="min-w-0">
              <p className="text-title text-ink">Rooftop Mixer</p>
              <p className="text-body-sm text-ink-muted">42 people here now</p>
            </div>
          </Card>
        </Sheet>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-label text-ink-faint">{title}</h2>
      {children}
    </section>
  )
}
