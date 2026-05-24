'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const AuthContext = createContext({})
const supabase = createClient()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [currentBranch, setCurrentBranchState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [profileError, setProfileError] = useState(null)

  // Sincronizar con localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('smartcaja_current_branch')
      if (stored) {
        try {
          setCurrentBranchState(JSON.parse(stored))
        } catch(e) {}
      }
    }
  }, [])

  const setCurrentBranch = (branch) => {
    setCurrentBranchState(branch)
    if (branch) {
      localStorage.setItem('smartcaja_current_branch', JSON.stringify(branch))
    } else {
      localStorage.removeItem('smartcaja_current_branch')
    }
  }

  const loadProfile = useCallback(async (userId) => {
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
        console.error('Error fetching profile:', error)
        if (error.code === 'PGRST116') {
          // Profile definitely does not exist in database
          setProfile(null)
          setTenant(null)
          setProfileLoaded(true)
        } else {
          // Network or transient DB connection error
          setProfileError(error.message || 'Error de conexión con la base de datos')
          setProfileLoaded(false)
        }
        return
      }

      if (profileData) {
        setProfile(profileData)
        setTenant(profileData.tenants)
        setProfileLoaded(true)

        // Apply tenant theme to CSS variables
        if (profileData.tenants?.theme_config) {
          const theme = profileData.tenants.theme_config
          if (typeof window !== 'undefined' && document?.documentElement) {
            document.documentElement.style.setProperty(
              '--color-primary', theme.primary_color || '#7C3AED'
            )
            document.documentElement.style.setProperty(
              '--color-secondary', theme.secondary_color || '#10B981'
            )
            
            // Apply background preset variables
            const bgPreset = theme.background_preset || 'matte'
            let base = '#060e20', surface = '#0b1326', card = '#131b2e', cardHover = '#171f33'
            if (bgPreset === 'cosmic') {
              base = '#0c081e'; surface = '#140e30'; card = '#1d1542'; cardHover = '#241b52'
            } else if (bgPreset === 'ocean') {
              base = '#020d1a'; surface = '#04172e'; card = '#062242'; cardHover = '#082a52'
            } else if (bgPreset === 'midnight') {
              base = '#000000'; surface = '#09090b'; card = '#18181b'; cardHover = '#27272a'
            }

            document.documentElement.style.setProperty('--bg-base', base)
            document.documentElement.style.setProperty('--bg-surface', surface)
            document.documentElement.style.setProperty('--bg-card', card)
            document.documentElement.style.setProperty('--bg-card-hover', cardHover)
            document.documentElement.style.setProperty('--bg-sidebar', base)
            document.documentElement.style.setProperty('--bg-input', card)
            
            // Save internationalization settings to localStorage for static helpers
            try {
              localStorage.setItem('smartcaja_tenant_currency', theme.currency || 'ARS')
              localStorage.setItem('smartcaja_tenant_locale', theme.locale || 'es-AR')
            } catch (storageErr) {
              console.warn('Could not save locale settings to localStorage:', storageErr)
            }
          }
        }
      } else {
        setProfile(null)
        setTenant(null)
        setProfileLoaded(true)
      }
    } catch (err) {
      console.error('Exception in loadProfile:', err)
      setProfileError(err.message || 'Excepción al cargar perfil')
      setProfileLoaded(false)
    }
  // supabase is a stable module-level singleton; no need to include it as dependency
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let active = true

    // Safety fallback: force loading to false after 3 seconds to prevent hangs
    const safetyTimeout = setTimeout(() => {
      if (active) {
        console.warn('Auth loading safety timeout triggered')
        setLoading(false)
      }
    }, 3000)

    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const currentUser = session?.user ?? null
        if (active) {
          setUser(currentUser)
          if (currentUser) {
            await loadProfile(currentUser.id)
          }
        }
      } catch (err) {
        console.error('Exception in getSession:', err)
      } finally {
        if (active) {
          clearTimeout(safetyTimeout)
          setLoading(false)
        }
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        try {
          if (active) {
            setUser(session?.user ?? null)
            if (session?.user) {
              await loadProfile(session.user.id)
            } else {
              setProfile(null)
              setTenant(null)
              setProfileLoaded(false)
              setProfileError(null)
            }
          }
        } catch (err) {
          console.error('Exception in onAuthStateChange handler:', err)
        }
      }
    )

    return () => {
      active = false
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  // supabase is stable; only re-run when loadProfile reference changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadProfile])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setTenant(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      tenant,
      currentBranch,
      setCurrentBranch,
      loading,
      profileLoaded,
      profileError,
      signOut,
      reloadProfile: () => user && loadProfile(user.id),
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
