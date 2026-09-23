import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Check,
  MessageCircle,
  MoreHorizontal,
  Search,
  UserPlus,
  UserRoundSearch,
  Users,
  X,
} from 'lucide-react'
import {
  cancelFriendRequest,
  listFriendRequests,
  listFriends,
  removeFriend,
  respondToFriendRequest,
  searchPeople,
  sendFriendRequest,
} from '#/server/friends'
import type { FriendState } from '#/server/friends'
import { startConversation } from '#/server/conversations'
import { blockUser } from '#/server/blocks'
import {
  Avatar,
  Badge,
  Button,
  CountBadge,
  EmptyState,
  Input,
  SegmentedControl,
  Sheet,
  Skeleton,
  useToast,
} from '#/components/ui'
import { VerifiedBadge } from '#/components/VerifiedBadge'

export const Route = createFileRoute('/friends')({ component: FriendsPage })

type Tab = 'friends' | 'requests' | 'find'

const ONLINE_THRESHOLD_MS = 5 * 60 * 1000

function isOnline(date: Date | string | null | undefined) {
  if (!date) return false
  return Date.now() - new Date(date).getTime() < ONLINE_THRESHOLD_MS
}

function lastSeen(date: Date | string | null | undefined): string {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  if (diff < ONLINE_THRESHOLD_MS) return 'Active now'
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `Active ${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Active ${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `Active ${days}d ago`
  return ''
}

function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])
  return debounced
}

function FriendsPage() {
  const [tab, setTab] = useState<Tab>('friends')
  const [friendQuery, setFriendQuery] = useState('')
  const [findQuery, setFindQuery] = useState('')
  const [menuFor, setMenuFor] = useState<{ userId: string; name: string } | null>(null)

  const qc = useQueryClient()
  const navigate = useNavigate()
  const { toast } = useToast()

  const debouncedFriendQuery = useDebounced(friendQuery)
  const debouncedFindQuery = useDebounced(findQuery)

  const { data: friends = [], isLoading: friendsLoading } = useQuery({
    queryKey: ['friends', debouncedFriendQuery],
    queryFn: () => listFriends({ data: { query: debouncedFriendQuery } }),
  })

  const { data: requests, isLoading: requestsLoading } = useQuery({
    queryKey: ['friend-requests'],
    queryFn: () => listFriendRequests(),
  })

  const { data: found = [], isFetching: finding } = useQuery({
    queryKey: ['people-search', debouncedFindQuery],
    queryFn: () => searchPeople({ data: { query: debouncedFindQuery } }),
    enabled: debouncedFindQuery.trim().length >= 2,
  })

  const incoming = requests?.incoming ?? []
  const outgoing = requests?.outgoing ?? []

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['friends'] })
    qc.invalidateQueries({ queryKey: ['friend-requests'] })
    qc.invalidateQueries({ queryKey: ['pending-request-count'] })
    qc.invalidateQueries({ queryKey: ['people-search'] })
    qc.invalidateQueries({ queryKey: ['swipe-deck'] })
  }

  const respond = useMutation({
    mutationFn: respondToFriendRequest,
    onSuccess: (_res, vars) => {
      invalidate()
      if (vars.data.action === 'accept') toast('Friend added', { tone: 'success' })
    },
    onError: (e: Error) => toast(e.message || 'That did not work.', { tone: 'error' }),
  })

  const add = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: (res) => {
      invalidate()
      toast(res.state === 'friends' ? 'You are now friends' : 'Request sent', { tone: 'success' })
    },
    onError: (e: Error) => toast(e.message || 'That did not work.', { tone: 'error' }),
  })

  const cancel = useMutation({
    mutationFn: cancelFriendRequest,
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast(e.message || 'That did not work.', { tone: 'error' }),
  })

  const remove = useMutation({
    mutationFn: removeFriend,
    onSuccess: () => {
      invalidate()
      setMenuFor(null)
      toast('Friend removed')
    },
    onError: (e: Error) => toast(e.message || 'That did not work.', { tone: 'error' }),
  })

  const block = useMutation({
    mutationFn: blockUser,
    onSuccess: () => {
      invalidate()
      qc.invalidateQueries({ queryKey: ['blocked-users'] })
      setMenuFor(null)
      toast('Blocked. They can no longer find you.')
    },
    onError: (e: Error) => toast(e.message || 'That did not work.', { tone: 'error' }),
  })

  const message = useMutation({
    mutationFn: startConversation,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['conversations'] })
      navigate({ to: '/chats/$chatId', params: { chatId: `match_${res.matchId}` } })
    },
    onError: (e: Error) => toast(e.message || 'Could not open that chat.', { tone: 'error' }),
  })

  const segments = useMemo(
    () => [
      { value: 'friends' as Tab, label: 'Friends', count: friends.length },
      { value: 'requests' as Tab, label: 'Requests', count: incoming.length },
      { value: 'find' as Tab, label: 'Find' },
    ],
    [friends.length, incoming.length],
  )

  return (
    <div className="page-wrap flex flex-1 flex-col py-5 pb-28">
      <h1 className="text-center text-h1 text-ink">Friends</h1>

      <SegmentedControl
        aria-label="Friends sections"
        className="mt-5"
        segments={segments}
        value={tab}
        onChange={setTab}
      />

      <div className="mt-5 flex-1">
        {tab === 'friends' && (
          <>
            {(friends.length > 0 || friendQuery) && (
              <Input
                value={friendQuery}
                onChange={(e) => setFriendQuery(e.target.value)}
                placeholder="Search your friends"
                leading={<Search />}
                className="mb-4"
              />
            )}

            {friendsLoading ? (
              <PersonRowSkeletons />
            ) : friends.length === 0 ? (
              <EmptyState
                icon={Users}
                title={friendQuery ? 'Nobody by that name' : 'No friends yet'}
                description={
                  friendQuery
                    ? 'Try a different name or location.'
                    : 'Add people from Discover, or search for someone you already know.'
                }
                action={
                  !friendQuery && (
                    <Button onClick={() => setTab('find')}>Find people</Button>
                  )
                }
              />
            ) : (
              <ul className="space-y-2">
                {friends.map((person) => (
                  <PersonRow
                    key={person.userId}
                    person={person}
                    subtitle={lastSeen(person.lastActiveDate) || person.location}
                    actions={
                      <>
                        <Button
                          icon
                          variant="soft"
                          aria-label={`Message ${person.name}`}
                          loading={message.isPending && message.variables?.data.receiverId === person.userId}
                          onClick={() => message.mutate({ data: { receiverId: person.userId } })}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          icon
                          variant="ghost"
                          aria-label={`More options for ${person.name}`}
                          onClick={() => setMenuFor({ userId: person.userId, name: person.name })}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </>
                    }
                  />
                ))}
              </ul>
            )}
          </>
        )}

        {tab === 'requests' && (
          <>
            {requestsLoading ? (
              <PersonRowSkeletons />
            ) : incoming.length === 0 && outgoing.length === 0 ? (
              <EmptyState
                icon={UserPlus}
                title="No requests"
                description="When someone asks to be friends, they'll show up here."
              />
            ) : (
              <div className="space-y-8">
                {incoming.length > 0 && (
                  <section>
                    <SectionHeading>
                      Wants to be friends
                      <CountBadge count={incoming.length} />
                    </SectionHeading>
                    <ul className="space-y-2">
                      {incoming.map((person) => {
                        const busy =
                          respond.isPending && respond.variables?.data.userId === person.userId
                        return (
                          <PersonRow
                            key={person.userId}
                            person={person}
                            subtitle={person.location}
                            actions={
                              <>
                                <Button
                                  icon
                                  variant="ghost"
                                  aria-label={`Decline ${person.name}`}
                                  disabled={busy}
                                  onClick={() =>
                                    respond.mutate({
                                      data: { userId: person.userId, action: 'decline' },
                                    })
                                  }
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  loading={busy}
                                  onClick={() =>
                                    respond.mutate({
                                      data: { userId: person.userId, action: 'accept' },
                                    })
                                  }
                                >
                                  <Check className="h-4 w-4" /> Accept
                                </Button>
                              </>
                            }
                          />
                        )
                      })}
                    </ul>
                  </section>
                )}

                {outgoing.length > 0 && (
                  <section>
                    <SectionHeading>Sent</SectionHeading>
                    <ul className="space-y-2">
                      {outgoing.map((person) => (
                        <PersonRow
                          key={person.userId}
                          person={person}
                          subtitle={person.location}
                          actions={
                            <Button
                              size="sm"
                              variant="outline"
                              loading={
                                cancel.isPending && cancel.variables?.data.userId === person.userId
                              }
                              onClick={() => cancel.mutate({ data: { userId: person.userId } })}
                            >
                              Cancel
                            </Button>
                          }
                        />
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            )}
          </>
        )}

        {tab === 'find' && (
          <>
            <Input
              value={findQuery}
              onChange={(e) => setFindQuery(e.target.value)}
              placeholder="Search by name"
              leading={<Search />}
              autoFocus
              className="mb-4"
            />

            {debouncedFindQuery.trim().length < 2 ? (
              <EmptyState
                icon={UserRoundSearch}
                title="Find someone"
                description="Type at least two letters of their name."
              />
            ) : finding ? (
              <PersonRowSkeletons />
            ) : found.length === 0 ? (
              <EmptyState
                icon={UserRoundSearch}
                title="No matches"
                description={`Nobody called "${debouncedFindQuery.trim()}" turned up.`}
              />
            ) : (
              <ul className="space-y-2">
                {found.map((person) => (
                  <PersonRow
                    key={person.userId}
                    person={person}
                    subtitle={person.location}
                    actions={
                      <FindAction
                        state={person.state}
                        pending={add.isPending && add.variables?.data.userId === person.userId}
                        onAdd={() => add.mutate({ data: { userId: person.userId } })}
                        onAccept={() =>
                          respond.mutate({ data: { userId: person.userId, action: 'accept' } })
                        }
                      />
                    }
                  />
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <Sheet
        open={!!menuFor}
        onClose={() => setMenuFor(null)}
        title={menuFor?.name}
        description="Manage this friendship."
      >
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            block
            loading={remove.isPending}
            onClick={() => menuFor && remove.mutate({ data: { userId: menuFor.userId } })}
          >
            Remove friend
          </Button>
          <Button
            variant="danger"
            block
            loading={block.isPending}
            onClick={() => menuFor && block.mutate({ data: menuFor.userId })}
          >
            Block
          </Button>
        </div>
      </Sheet>
    </div>
  )
}

function FindAction({
  state,
  pending,
  onAdd,
  onAccept,
}: {
  state: FriendState
  pending: boolean
  onAdd: () => void
  onAccept: () => void
}) {
  if (state === 'friends') return <Badge tone="neutral">Friends</Badge>
  if (state === 'outgoing') return <Badge tone="neutral">Requested</Badge>
  if (state === 'incoming') {
    return (
      <Button size="sm" onClick={onAccept}>
        <Check className="h-4 w-4" /> Accept
      </Button>
    )
  }
  return (
    <Button size="sm" variant="outline" loading={pending} onClick={onAdd}>
      <UserPlus className="h-4 w-4" /> Add
    </Button>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 flex items-center gap-2 text-label text-ink-faint">{children}</h2>
  )
}

function PersonRow({
  person,
  subtitle,
  actions,
}: {
  person: { userId: string; name: string; photo: string | null; verifiedAt: Date | null; lastActiveDate?: Date | null }
  subtitle?: string
  actions?: React.ReactNode
}) {
  return (
    <li className="flex items-center gap-3 rounded-card bg-canvas-raised p-3 shadow-sm transition hover:shadow-md">
      <Avatar
        src={person.photo}
        alt={person.name}
        size="lg"
        online={person.lastActiveDate !== undefined ? isOnline(person.lastActiveDate) : undefined}
      />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-title text-ink">
          {person.name}
          {person.verifiedAt && <VerifiedBadge />}
        </p>
        {subtitle && <p className="truncate text-body-sm text-ink-muted">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">{actions}</div>
    </li>
  )
}

function PersonRowSkeletons() {
  return (
    <ul className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <li key={i} className="flex items-center gap-3 rounded-card bg-canvas-raised p-3 shadow-sm">
          <Skeleton className="h-14 w-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-28 rounded-full" />
            <Skeleton className="h-3 w-20 rounded-full" />
          </div>
          <Skeleton className="h-9 w-20 rounded-full" />
        </li>
      ))}
    </ul>
  )
}
