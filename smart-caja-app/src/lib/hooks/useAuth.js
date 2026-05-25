'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [profileError, setProfileError] = useState(null)
  const [supabase] = useState(() => createClient())

  const loadProfile = useCallback(async (userId) => {
    setProfileLoaded(false)
    setProfileError(null)
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
        if (error.code === 'PGRST116') {
          // No profile row exists yet - this is a valid state (needs self-healing/setup)
          setProfile(null)
          setTenant(null)
          setProfileLoaded(true)
          setProfileError(null)
        } else {
          console.error('Error loading profile:', error)
          setProfileError(error.message || 'Error cargando perfil')
          setProfileLoaded(false)
        }
        return
      }

      if (profileData) {
        setProfile(profileData)
        setTenant(profileData.tenants)
        setProfileLoaded(true)

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
      } else {
        // Fallback for null profileData without error
        setProfile(null)
        setTenant(null)
        setProfileLoaded(true)
      }
    } catch (err) {
      console.error('Exception inside loadProfile:', err)
      setProfileError(err.message || 'Excepción cargando perfil')
      setProfileLoaded(false)
    }
  }, [supabase])

  useEffect(() => {
    let isMounted = true
    let activeUserId = null

    const syncProfile = async (currentUser) => {
      if (!isMounted) return

      if (currentUser) {
        if (activeUserId === currentUser.id) {
          // Already synchronized or synchronization in progress for this user
          return
        }
        activeUserId = currentUser.id
        setUser(currentUser)
        try {
          await loadProfile(currentUser.id)
        } catch (err) {
          console.error('[useAuth] syncProfile loadProfile failed:', err)
        } finally {
          if (isMounted) setLoading(false)
        }
      } else {
        activeUserId = null
        setUser(null)
        setProfile(null)
        setTenant(null)
        setProfileLoaded(true)
        setProfileError(null)
        if (isMounted) setLoading(false)
      }
    }

    const initialize = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (isMounted) {
          await syncProfile(currentUser)
        }
      } catch (err) {
        console.error('[useAuth] initialize getSession failed:', err)
        if (isMounted) setLoading(false)
      }
    }

    initialize()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (isMounted) {
          const currentUser = session?.user ?? null
          await syncProfile(currentUser)
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
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
      setProfileLoaded(false)
      setProfileError(null)
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      tenant,
      loading,
      profileLoaded,
      profileError,
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
