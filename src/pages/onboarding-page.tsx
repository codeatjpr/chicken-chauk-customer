import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2Icon } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ROUTES } from '@/constants/routes'
import { flushGuestCartToServer } from '@/lib/flush-guest-cart'
import { flushPendingCartAdd } from '@/lib/flush-pending-cart'
import * as profileApi from '@/services/profile.service'
import { useAuthStore } from '@/stores/auth-store'
import { getApiErrorMessage } from '@/utils/api-error'
import { profileNeedsDisplayName } from '@/utils/profile'

const schema = z.object({
  name: z.string().min(2, 'Enter at least 2 characters').max(80).trim(),
})

type Form = z.infer<typeof schema>

export function OnboardingPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const qc = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const from =
    (location.state as { from?: string } | null)?.from ?? ROUTES.home

  useEffect(() => {
    if (user && !profileNeedsDisplayName(user)) {
      navigate(from, { replace: true })
    }
  }, [user, from, navigate])

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { name: user?.name?.trim() ?? '' },
  })

  const saveMut = useMutation({
    mutationFn: (name: string) => profileApi.updateProfile({ name }),
    onSuccess: async (nextUser) => {
      setUser(nextUser)
      toast.success("You're set")
      const guestMerged = await flushGuestCartToServer(qc)
      const added = await flushPendingCartAdd(qc)
      if (guestMerged) toast.success('Your cart was saved to your account')
      if (added) toast.success('Added to cart')
      navigate(from, { replace: true })
    },
    onError: (e) =>
      toast.error(getApiErrorMessage(e, 'Could not save your name')),
  })

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center py-8">
      <Card className="border-border/80 shadow-md">
        <CardHeader>
          <CardTitle className="font-heading text-xl">Your name</CardTitle>
          <CardDescription>
            We use this for orders and delivery. You can change it later in
            Account.
          </CardDescription>
        </CardHeader>
        <form
          onSubmit={form.handleSubmit((v) => saveMut.mutate(v.name))}
          className="contents"
        >
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="onb-name">Display name</Label>
              <Input
                id="onb-name"
                autoComplete="name"
                placeholder="e.g. Rahul Sharma"
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-destructive text-sm" role="alert">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full gap-2"
              disabled={saveMut.isPending}
            >
              {saveMut.isPending && (
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
              )}
              Continue
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
