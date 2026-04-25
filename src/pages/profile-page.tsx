import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  ChevronRight,
  Heart,
  HelpCircle,
  Loader2Icon,
  LogOut,
  MapPin,
  Package,
  Pencil,
  User,
  Wallet,
} from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { queryKeys } from '@/constants/query-keys'
import { ROUTES } from '@/constants/routes'
import { getMe } from '@/services/auth.service'
import * as profileApi from '@/services/profile.service'
import { useAuthStore } from '@/stores/auth-store'
import { getApiErrorMessage } from '@/utils/api-error'
import { formatInr } from '@/utils/format'
import { formatIndianMobileDisplay, maskPhoneForOtpStep } from '@/utils/phone'

type ProfileForm = { name: string; email: string }

const NAV_LINKS = [
  { to: ROUTES.orders, label: 'My orders', icon: Package, desc: 'Track and manage deliveries' },
  { to: ROUTES.wallet, label: 'Wallet', icon: Wallet, desc: 'Balance and transaction history' },
  { to: ROUTES.profileAddresses, label: 'Saved addresses', icon: MapPin, desc: 'Manage delivery addresses' },
  { to: ROUTES.favorites, label: 'Favorites', icon: Heart, desc: 'Saved restaurants and dishes' },
  { to: ROUTES.notifications, label: 'Notifications', icon: Bell, desc: 'Order updates and alerts' },
  { to: ROUTES.help, label: 'Help', icon: HelpCircle, desc: 'Support and FAQs' },
] as const

export function ProfilePage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const signOut = useAuthStore((s) => s.signOut)
  const statsQuery = useQuery({
    queryKey: queryKeys.profile.stats,
    queryFn: () => profileApi.fetchProfileWithStats(),
  })

  const profile = statsQuery.data

  const form = useForm<ProfileForm>({ defaultValues: { name: '', email: '' } })

  useEffect(() => {
    if (profile) {
      form.reset({ name: profile.name ?? '', email: profile.email ?? '' })
    }
  }, [profile, form])

  const updateMut = useMutation({
    mutationFn: (body: { name?: string; email?: string }) => profileApi.updateProfile(body),
    onSuccess: async () => {
      toast.success('Profile updated')
      await qc.invalidateQueries({ queryKey: queryKeys.profile.stats })
      try {
        const me = await getMe()
        setUser(me)
      } catch { /* optional */ }
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not update profile')),
  })

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Signed out')
      navigate(ROUTES.login, { replace: true })
    } catch {
      toast.error('Could not sign out')
    }
  }

  const onSaveProfile = form.handleSubmit((values) => {
    const payload: { name?: string; email?: string } = {}
    const n = values.name.trim()
    if (n.length >= 2) payload.name = n
    const em = values.email.trim()
    if (em) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
        toast.error('Enter a valid email or leave it blank')
        return
      }
      payload.email = em
    }
    if (Object.keys(payload).length === 0) {
      toast.message('Add a name (2+ characters) or email to save')
      return
    }
    updateMut.mutate(payload)
  })

  return (
    <div className="pb-8 lg:pb-12">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Orders, wallet, and profile details.
        </p>
      </div>

      {/*
        Layout strategy:
          Mobile  → single column DOM order: [top] avatar/stats → quick-links → form/appearance/sign-out [bottom]
          Desktop → two-column grid:  col-1 row-1 avatar/stats, col-2 rows 1-2 quick-links, col-1 row-2 form/appearance/sign-out
      */}
      <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8 lg:items-start">

        {/* ── TOP-LEFT: Avatar + stats ── col-1 row-1 on desktop */}
        <div className="space-y-5 lg:col-start-1 lg:row-start-1">

          {/* Avatar + name summary */}
          <div className="border-border/70 bg-card flex items-center gap-5 rounded-2xl border p-5">
            <div className="bg-primary/10 flex size-16 shrink-0 items-center justify-center rounded-full">
              <User className="text-primary size-7" />
            </div>
            <div className="min-w-0 flex-1">
              {statsQuery.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ) : (
                <>
                  <p className="text-lg font-semibold">{profile?.name ?? user?.name ?? 'My Account'}</p>
                  <p className="text-muted-foreground text-sm">
                    {user?.phone ? maskPhoneForOtpStep(user.phone) : ''}
                    {profile?.email ? ` · ${profile.email}` : ''}
                  </p>
                </>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={() => document.getElementById('profile-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            >
              <Pencil className="size-3.5" />
              Edit
            </Button>
          </div>

          {/* Stats */}
          {statsQuery.isLoading ? (
            <Skeleton className="h-28 rounded-2xl" />
          ) : statsQuery.isError ? (
            <p className="text-destructive text-sm">Could not load your stats.</p>
          ) : profile ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="border-border/70 bg-card rounded-2xl border p-4">
                <p className="text-muted-foreground text-xs font-medium">Wallet balance</p>
                <p className="mt-1.5 text-2xl font-semibold tabular-nums">
                  {formatInr(profile.stats.walletBalance)}
                </p>
                <Link to={ROUTES.wallet} className="text-primary mt-2 inline-flex items-center gap-1 text-xs font-medium">
                  View wallet <ChevronRight className="size-3" />
                </Link>
              </div>
              <div className="border-border/70 bg-card rounded-2xl border p-4">
                <p className="text-muted-foreground text-xs font-medium">Total orders</p>
                <p className="mt-1.5 text-2xl font-semibold tabular-nums">{profile.stats.totalOrders}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {profile.stats.deliveredOrders} delivered · {profile.stats.cancelledOrders} cancelled
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* ── RIGHT / MOBILE-MIDDLE: Quick links ── col-2 rows 1-2 on desktop, between stats and form on mobile */}
        <div className="mt-5 lg:mt-0 lg:col-start-2 lg:row-start-1 lg:row-span-2">
          <div className="border-border/70 bg-card sticky top-24 rounded-2xl border overflow-hidden">
            <div className="border-border/50 border-b px-5 py-4">
              <h2 className="font-semibold">Quick links</h2>
              <p className="text-muted-foreground mt-0.5 text-xs">Jump to any section</p>
            </div>
            <nav className="p-2">
              {NAV_LINKS.map(({ to, label, icon: Icon, desc }) => (
                <Link
                  key={to}
                  to={to}
                  className="hover:bg-muted/60 flex items-center gap-3 rounded-xl px-3 py-3 transition-colors"
                >
                  <div className="bg-primary/8 flex size-9 shrink-0 items-center justify-center rounded-xl">
                    <Icon className="text-primary size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-muted-foreground text-xs">{desc}</p>
                  </div>
                  <ChevronRight className="text-muted-foreground size-4 shrink-0" />
                </Link>
              ))}
            </nav>
            <p className="text-muted-foreground border-border/50 border-t px-5 py-3 text-xs">
              Saved addresses are also available at checkout.
            </p>
          </div>
        </div>

        {/* ── BOTTOM-LEFT: Profile form + Appearance + Sign out ── col-1 row-2 on desktop, last on mobile */}
        <div className="mt-5 lg:mt-0 lg:col-start-1 lg:row-start-2 space-y-5">

          {/* Profile edit form */}
          <div id="profile-details" className="border-border/70 bg-card scroll-mt-28 rounded-2xl border p-5 space-y-4">
            <div>
              <h2 className="font-semibold">Profile details</h2>
              <p className="text-muted-foreground mt-0.5 text-sm">How we reach you</p>
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground text-xs">Mobile number</p>
              <p className="mt-0.5 font-medium">
                {user?.phone ? formatIndianMobileDisplay(user.phone) : '—'}
              </p>
            </div>
            <form onSubmit={onSaveProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prof-name">Display name</Label>
                <Input id="prof-name" placeholder="e.g. Priya Sharma" {...form.register('name')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prof-email">Email (optional)</Label>
                <Input
                  id="prof-email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...form.register('email')}
                />
              </div>
              <Button type="submit" disabled={updateMut.isPending} className="w-full sm:w-auto">
                {updateMut.isPending && <Loader2Icon className="size-4 animate-spin" />}
                Save changes
              </Button>
            </form>
          </div>

          {/* Sign out */}
          <Button
            type="button"
            variant="outline"
            className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => void handleSignOut()}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  )
}
