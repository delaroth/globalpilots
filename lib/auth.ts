import bcrypt from 'bcryptjs'
import { supabase } from './supabase'

export interface User {
  id: string
  email: string
  name: string | null
  home_airport: string | null
  avatar_url: string | null
  auth_provider: string
  email_verified: boolean
  created_at: string
  last_login: string
}

export interface Session {
  user: User
  expires: string
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

/**
 * Create a new user with email and password
 */
export async function createUser(email: string, password: string, name?: string) {
  const passwordHash = await hashPassword(password)

  const { data, error } = await (supabase as any)
    .from('users')
    .insert({
      email: email.toLowerCase(),
      password_hash: passwordHash,
      name,
      auth_provider: 'email',
      email_verified: false,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // Create user preferences
  await (supabase as any)
    .from('user_preferences')
    .insert({
      user_id: data.id,
    })

  // Create user statistics
  await (supabase as any)
    .from('user_statistics')
    .insert({
      user_id: data.id,
    })

  return data
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string) {
  const { data, error } = await (supabase as any)
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single()

  if (error || !data) {
    return null
  }

  return data
}

/**
 * Find user by ID
 */
export async function findUserById(id: string) {
  const { data, error } = await (supabase as any)
    .from('users')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return null
  }

  return data
}

/**
 * Update user's last login timestamp
 */
export async function updateLastLogin(userId: string) {
  await (supabase as any)
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', userId)
}

/**
 * Create or update OAuth user (Google)
 */
export async function createOrUpdateOAuthUser(
  email: string,
  name: string,
  avatarUrl?: string,
  provider: string = 'google'
) {
  // Check if user exists
  const existingUser = await findUserByEmail(email)

  if (existingUser) {
    // Update avatar and last login
    const { data } = await (supabase as any)
      .from('users')
      .update({
        avatar_url: avatarUrl || existingUser.avatar_url,
        last_login: new Date().toISOString(),
      })
      .eq('id', existingUser.id)
      .select()
      .single()

    return data
  }

  // Create new OAuth user
  const { data, error } = await (supabase as any)
    .from('users')
    .insert({
      email: email.toLowerCase(),
      name,
      avatar_url: avatarUrl,
      auth_provider: provider,
      email_verified: true, // OAuth providers verify emails
      password_hash: null,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // Create user preferences
  await (supabase as any)
    .from('user_preferences')
    .insert({
      user_id: data.id,
    })

  // Create user statistics
  await (supabase as any)
    .from('user_statistics')
    .insert({
      user_id: data.id,
    })

  return data
}

/**
 * Link existing anonymous alerts to user account
 */
export async function linkAlertsToUser(email: string, userId: string) {
  const { error } = await (supabase as any)
    .from('price_alerts')
    .update({ user_id: userId })
    .eq('email', email)
    .is('user_id', null)

  if (error) {
    console.error('Error linking alerts to user:', error)
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: string, updates: {
  name?: string
  home_airport?: string
}) {
  const { data, error } = await (supabase as any)
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

/**
 * Change user password
 */
export async function changeUserPassword(userId: string, newPassword: string) {
  const passwordHash = await hashPassword(newPassword)

  const { error } = await (supabase as any)
    .from('users')
    .update({
      password_hash: passwordHash,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    throw new Error(error.message)
  }
}
