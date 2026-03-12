import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import {
  findUserByEmail,
  verifyPassword,
  createOrUpdateOAuthUser,
  updateLastLogin,
  linkAlertsToUser,
} from './auth'

export const authOptions: NextAuthOptions = {
  providers: [
    // Email/Password Provider
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter your email and password')
        }

        const user = await findUserByEmail(credentials.email)

        if (!user || !user.password_hash) {
          throw new Error('Invalid email or password')
        }

        const isValid = await verifyPassword(credentials.password, user.password_hash)

        if (!isValid) {
          throw new Error('Invalid email or password')
        }

        // Update last login
        await updateLastLogin(user.id)

        // Link any anonymous alerts to this user
        await linkAlertsToUser(user.email, user.id)

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar_url,
        }
      },
    }),

    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle Google OAuth sign in
      if (account?.provider === 'google' && profile?.email) {
        try {
          const oauthUser = await createOrUpdateOAuthUser(
            profile.email,
            profile.name || '',
            (profile as any).picture,
            'google'
          )

          // Link any anonymous alerts to this user
          await linkAlertsToUser(profile.email, oauthUser.id)

          // Update user object with database ID
          user.id = oauthUser.id

          return true
        } catch (error) {
          console.error('Error in Google sign in:', error)
          return false
        }
      }

      return true
    },

    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
        token.picture = user.image
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
      }

      return session
    },
  },

  pages: {
    signIn: '/login',
    signOut: '/',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
}
