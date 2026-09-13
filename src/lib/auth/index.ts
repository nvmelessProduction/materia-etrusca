import NextAuth, { type NextAuthConfig } from 'next-auth'
import Resend from 'next-auth/providers/resend'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/db'
import { accounts, sessions, users, verificationTokens } from '@/db/schema'
import { adminEmails, optionalEnv } from '@/lib/env'

/**
 * L'account è **facoltativo**: serve solo a chi vuole rivedere i propri ordini
 * e all'artigiano per entrare nel pannello. Si compra benissimo da ospiti.
 *
 * Un solo modo di entrare: il link via email. Niente password da dimenticare.
 */

const chiaveResend = optionalEnv('RESEND_API_KEY') ?? optionalEnv('AUTH_RESEND_KEY')

const configurazione: NextAuthConfig = {
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: 'database', maxAge: 60 * 60 * 24 * 90 },
  // Senza chiave email non si può accedere, ma il sito deve compilare lo stesso.
  providers: chiaveResend
    ? [
        Resend({
          apiKey: chiaveResend,
          from: optionalEnv('EMAIL_FROM') ?? 'Materia Etrusca <onboarding@resend.dev>',
          name: 'Link via email',
        }),
      ]
    : [],
  pages: {
    signIn: '/accedi',
    verifyRequest: '/accedi/controlla-la-posta',
    error: '/accedi',
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        // Il ruolo sta sulla riga utente, ma l'elenco in ambiente ha l'ultima parola:
        // così l'artigiano entra al primo accesso senza toccare il database.
        const daAmbiente = adminEmails().includes(user.email.toLowerCase())
        session.user.role = daAmbiente ? 'admin' : ((user as { role?: string }).role ?? 'customer')
      }
      return session
    },
  },
  trustHost: true,
}

export const { handlers, auth, signIn, signOut } = NextAuth(configurazione)

export type RuoloSessione = 'customer' | 'admin'

const ID_ADMIN_SVILUPPO = '00000000-0000-4000-8000-000000000001'

/**
 * Scorciatoia **solo per lo sviluppo locale**: permette di lavorare al pannello
 * senza configurare l'invio delle email. In produzione è inerte, qualunque cosa
 * dicano le variabili d'ambiente.
 */
function amministratoreDiSviluppo(): {
  id: string
  email: string
  nome: null
  ruolo: RuoloSessione
} | null {
  if (process.env.NODE_ENV === 'production') return null
  const email = optionalEnv('ADMIN_DEV_EMAIL')
  if (!email) return null
  // Identificativo fisso e valido come UUID: lo cercano anche le query del carrello.
  return { id: ID_ADMIN_SVILUPPO, email, nome: null, ruolo: 'admin' }
}

export async function sessioneUtente(): Promise<{
  id: string
  email: string
  nome: string | null
  ruolo: RuoloSessione
} | null> {
  const sviluppo = amministratoreDiSviluppo()
  if (sviluppo) return sviluppo

  // Senza provider configurati non esiste alcuna sessione: si evita il giro al database.
  if (!chiaveResend) return null

  const sessione = await auth()
  const utente = sessione?.user
  if (!utente?.id || !utente.email) return null

  return {
    id: utente.id,
    email: utente.email,
    nome: utente.name ?? null,
    ruolo: utente.role === 'admin' ? 'admin' : 'customer',
  }
}

export async function richiediAmministratore(): Promise<{ id: string; email: string }> {
  const utente = await sessioneUtente()
  if (!utente || utente.ruolo !== 'admin') {
    throw new Error('Serve un accesso da amministratore.')
  }
  return { id: utente.id, email: utente.email }
}

/** L'accesso è configurato solo se c'è di che mandare le email. */
export const accessoDisponibile = Boolean(chiaveResend)
