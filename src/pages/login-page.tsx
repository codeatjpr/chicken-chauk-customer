import { useLocation, useNavigate } from 'react-router-dom'
import logoMark from '@/assets/logo.png'
import { LoginFlow } from '@/components/molecules/login-flow'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { ROUTES } from '@/constants/routes'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? ROUTES.home

  return (
    <div className="from-accent/30 via-background to-background relative min-h-svh bg-linear-to-br">
      <div className="absolute inset-e-4 top-4 flex justify-end gap-2">
        <ThemeToggle />
      </div>

      <div className="flex min-h-svh items-center justify-center p-4 pb-10">
        <div className="border-border/80 w-full max-w-md rounded-2xl border bg-card p-6 shadow-md">
          {/* Logo */}
          <div className="mb-6 flex flex-col items-center gap-3">
            <img src={logoMark} alt="Chicken Chauk" className="size-14 rounded-2xl object-contain" />
            <div className="text-center">
              <h1 className="font-heading text-xl font-semibold">Sign in to Chicken Chauk</h1>
              <p className="text-muted-foreground mt-1 text-sm">
                We'll send a one-time code to your mobile number.
              </p>
            </div>
          </div>

          <LoginFlow
            from={from}
            onSuccess={() => {
              navigate(from, { replace: true })
            }}
            onCancel={() => {
              navigate(ROUTES.root, { replace: true })
            }}
          />
        </div>
      </div>
    </div>
  )
}
