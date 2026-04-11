import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  ChevronRight,
  Heart,
  HelpCircle,
  Loader2Icon,
  MapPin,
  Package,
  Wallet,
} from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { cn } from '@/lib/utils'
import { maskPhoneForOtpStep } from '@/utils/phone'

type ProfileForm = {
  name: string
  email: string
}

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

  const form = useForm<ProfileForm>({
    defaultValues: { name: '', email: '' },
  })

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name ?? '',
        email: profile.email ?? '',
      })
    }
  }, [profile, form])

  const updateMut = useMutation({
    mutationFn: (body: { name?: string; email?: string }) =>
      profileApi.updateProfile(body),
    onSuccess: async () => {
      toast.success('Profile updated')
      await qc.invalidateQueries({ queryKey: queryKeys.profile.stats })
      try {
        const me = await getMe()
        setUser(me)
      } catch {
        /* optional */
      }
    },
    onError: (e) =>
      toast.error(getApiErrorMessage(e, 'Could not update profile')),
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
    <div className="mx-auto max-w-md space-y-6 pb-8">
      <div>
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          Account
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Orders, wallet, and profile details.
        </p>
      </div>

      {statsQuery.isLoading ? (
        <Skeleton className="h-32 rounded-xl" />
      ) : statsQuery.isError ? (
        <p className="text-destructive text-sm">Could not load your stats.</p>
      ) : profile ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Wallet</CardDescription>
              <CardTitle className="text-lg tabular-nums">
                {formatInr(profile.stats.walletBalance)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Orders</CardDescription>
              <CardTitle className="text-lg tabular-nums">
                {profile.stats.totalOrders}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-xs">
              {profile.stats.deliveredOrders} delivered ·{' '}
              {profile.stats.cancelledOrders} cancelled
            </CardContent>
          </Card>
        </div>
      ) : null}

      <Link
        to={ROUTES.orders}
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'flex w-full items-center justify-between gap-2',
        )}
      >
        <span className="flex items-center gap-2">
          <Package className="size-4" />
          My orders
        </span>
        <ChevronRight className="size-4 opacity-50" />
      </Link>

      <Link
        to={ROUTES.wallet}
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'flex w-full items-center justify-between gap-2',
        )}
      >
        <span className="flex items-center gap-2">
          <Wallet className="size-4" />
          Wallet
        </span>
        <ChevronRight className="size-4 opacity-50" />
      </Link>

      <Link
        to={ROUTES.profileAddresses}
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'flex w-full items-center justify-between gap-2',
        )}
      >
        <span className="flex items-center gap-2">
          <MapPin className="size-4" />
          Saved addresses
        </span>
        <ChevronRight className="size-4 opacity-50" />
      </Link>

      <Link
        to={ROUTES.favorites}
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'flex w-full items-center justify-between gap-2',
        )}
      >
        <span className="flex items-center gap-2">
          <Heart className="size-4" />
          Favorites
        </span>
        <ChevronRight className="size-4 opacity-50" />
      </Link>

      <Link
        to={ROUTES.notifications}
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'flex w-full items-center justify-between gap-2',
        )}
      >
        <span className="flex items-center gap-2">
          <Bell className="size-4" />
          Notifications
        </span>
        <ChevronRight className="size-4 opacity-50" />
      </Link>

      <Link
        to={ROUTES.help}
        className={cn(
          buttonVariants({ variant: 'outline' }),
          'flex w-full items-center justify-between gap-2',
        )}
      >
        <span className="flex items-center gap-2">
          <HelpCircle className="size-4" />
          Help
        </span>
        <ChevronRight className="size-4 opacity-50" />
      </Link>
      <p className="text-muted-foreground -mt-2 text-xs">
        Saved addresses are also available at checkout.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>How we reach you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <span className="text-muted-foreground">Phone</span>
            <p className="font-medium">
              {user?.phone ? maskPhoneForOtpStep(user.phone) : '—'}
            </p>
          </div>
          <Separator />
          <form onSubmit={onSaveProfile} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="prof-name">Display name</Label>
              <Input id="prof-name" {...form.register('name')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prof-email">Email (optional)</Label>
              <Input
                id="prof-email"
                type="email"
                autoComplete="email"
                {...form.register('email')}
              />
            </div>
            <Button type="submit" disabled={updateMut.isPending}>
              {updateMut.isPending && (
                <Loader2Icon className="size-4 animate-spin" />
              )}
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Button
        type="button"
        variant="destructive"
        className="w-full"
        onClick={() => void handleSignOut()}
      >
        Sign out
      </Button>
    </div>
  )
}
