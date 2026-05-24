'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const loadProfile = useCallback(async (userId) => {
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select(`
          *,
          tenants (*)
        `)
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error loading profile:', error)
        return
      }

      if (profileData) {
        setProfile(profileData)
        setTenant(profileData.tenants)

        // Apply tenant theme to CSS variables safely
        if (profileData.tenants?.theme_config && typeof window !== 'undefined' && document?.documentElement) {
          const theme = profileData.tenants.theme_config
          if (theme.primary_color) {
            document.documentElement.style.setProperty(
              '--color-primary', theme.primary_color
            )
          }
          if (theme.secondary_color) {
            document.documentElement.style.setProperty(
              '--color-secondary', theme.secondary_color
            )
          }
        }
      }
    } catch (err) {
      console.error('Exception inside loadProfile:', err)
    }
  }, [supabase])

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        setUser(currentUser)
        if (currentUser) {
          await loadProfile(currentUser.id)
        }
      } catch (err) {
        console.error('Exception inside getSession:', err)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        try {
          if (session?.user) {
            await loadProfile(session.user.id)
          } else {
            setProfile(null)
            setTenant(null)
          }
        } catch (err) {
          console.error('Exception inside onAuthStateChange handler:', err)
        } finally {
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, loadProfile])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error('Exception inside signOut:', err)
    } finally {
      setUser(null)
      setProfile(null)
      setTenant(null)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      tenant,
      loading,
      signOut,
      reloadProfile: async () => {
        if (user) {
          setLoading(true)
          try {
            await loadProfile(user.id)
          } catch (err) {
            console.error('Exception in reloadProfile:', err)
          } finally {
            setLoading(false)
          }
        }
      },
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
