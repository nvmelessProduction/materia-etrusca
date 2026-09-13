import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { accessoDisponibile, signIn } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Accedi',
  robots: { index: false, follow: false },
}

export default async function PaginaAccesso({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string }>
}) {
  const { email, error } = await searchParams

  async function invia(modulo: FormData): Promise<void> {
    'use server'
    const indirizzo = String(modulo.get('email') ?? '').trim()
    if (!indirizzo) redirect('/accedi?error=email')
    await signIn('resend', { email: indirizzo, redirectTo: '/area-personale' })
  }

  return (
    <div className="contenitore max-w-md py-20 md:py-28">
      <h1 className="font-display text-4xl font-light md:text-5xl">Entra con un link</h1>
      <p className="text-testo-tenue mt-5 leading-relaxed">
        Niente password da inventare e da dimenticare. Scrivi la tua email: ti mando un link che
        vale una volta sola.
      </p>

      {!accessoDisponibile ? (
        <p role="alert" className="border-bordo bg-tufo mt-8 border p-4 text-sm">
          L’accesso non è ancora attivo su questo sito. Per comprare non serve comunque: si può
          ordinare da ospiti.
        </p>
      ) : (
        <form action={invia} className="mt-10">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={email ?? ''}
            className="mt-1.5"
          />
          {error ? (
            <p role="alert" className="text-errore mt-2 text-sm">
              Controlla l’indirizzo e riprova.
            </p>
          ) : null}
          <Button type="submit" size="lg" className="mt-6 w-full">
            Mandami il link
          </Button>
        </form>
      )}

      <p className="text-testo-tenue mt-8 text-sm">
        L’account serve solo a rivedere i tuoi ordini. Per comprare non è mai obbligatorio.
      </p>
    </div>
  )
}
