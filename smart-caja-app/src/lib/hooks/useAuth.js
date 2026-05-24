'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const AuthContext = createContext({})
const supabase = createClient()

// Wraps any promise with a hard timeout — guarantees it always resolves/rejects
function withTimeout(promise, ms, label = 'operation') {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout (${ms}ms) en ${label}`)), ms)
  )
  return Promise.race([promise, timeout])
}

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
        try { setCurrentBranchState(JSON.parse(stored)) } catch(e) {}
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

  const applyTheme = useCallback((theme) => {
    if (typeof window === 'undefined' || !document?.documentElement) return
    document.documentElement.style.setProperty('--color-primary', theme.primary_color || '#7C3AED')
    document.documentElement.style.setProperty('--color-secondary', theme.secondary_color || '#10B981')
    const bgPreset = theme.background_preset || 'matte'
    let base = '#060e20', surface = '#0b1326', card = '#131b2e', cardHover = '#171f33'
    if (bgPreset === 'cosmic')   { base = '#0c081e'; surface = '#140e30'; card = '#1d1542'; cardHover = '#241b52' }
    else if (bgPreset === 'ocean')    { base = '#020d1a'; surface = '#04172e'; card = '#062242'; cardHover = '#082a52' }
    else if (bgPreset === 'midnight') { base = '#000000'; surface = '#09090b'; card = '#18181b'; cardHover = '#27272a' }
    document.documentElement.style.setProperty('--bg-base', base)
    document.documentElement.style.setProperty('--bg-surface', surface)
    document.documentElement.style.setProperty('--bg-card', card)
    document.documentElement.style.setProperty('--bg-card-hover', cardHover)
    document.documentElement.style.setProperty('--bg-sidebar', base)
    document.documentElement.style.setProperty('--bg-input', card)
    try {
      localStorage.setItem('smartcaja_tenant_currency', theme.currency || 'ARS')
      localStorage.setItem('smartcaja_tenant_locale', theme.locale || 'es-AR')
    } catch(e) {}
  }, [])

  const loadProfile = useCallback(async (userId) => {
    setProfileError(null)
    try {
      // Hard 6-second timeout on the Supabase fetch — guarantees this always resolves
      const fetchResult = await withTimeout(
        supabase
          .from('profiles')
          .select('*, tenants (*)')
          .eq('id', userId)
          .single(),
        6000,
        'carga de perfil'
      )

      const { data: profileData, error } = fetchResult

      if (error) {
        console.error('[useAuth] Error fetching profile:', error)
        if (error.code !== 'PGRST116') {
          setProfileError(error.message || 'Error de conexión')
        }
        setProfile(null)
        setTenant(null)
        return
      }

      if (profileData) {
        setProfile(profileData)
        setTenant(profileData.tenants)
        if (profileData.tenants?.theme_config) {
          applyTheme(profileData.tenants.theme_config)
        }
      } else {
        setProfile(null)
        setTenant(null)
      }
    } catch (err) {
      console.error('[useAuth] loadProfile failed:', err.message)
      setProfileError(err.message || 'No se pudo cargar el perfil')
      setProfile(null)
      setTenant(null)
    } finally {
      // ALWAYS runs — guarantees AppLayout never hangs
      setProfileLoaded(true)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyTheme])

  useEffect(() => {
    let active = true

    const init = async () => {
      try {
        // getSession also gets a timeout so it can't hang
        const { data: { session } } = await withTimeout(
          supabase.auth.getSession(),
          8000,
          'getSession'
        )
        const currentUser = session?.user ?? null
        if (!active) return
        setUser(currentUser)
        if (currentUser) {
          await loadProfile(currentUser.id)
        } else {
          // No user — nothing to load
          setProfileLoaded(false)
          setProfile(null)
          setTenant(null)
        }
      } catch (err) {
        console.error('[useAuth] init failed:', err.message)
        // Even on total failure, don't leave the app hanging
        if (active) {
          setProfileError(err.message)
          setProfileLoaded(true)
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    init()

    // onAuthStateChange handles subsequent auth events (token refresh, sign out, etc.)
    // We DON'T call loadProfile here on INITIAL_SESSION to avoid double-fetching
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!active) return

        // Skip INITIAL_SESSION — init() already handles the first load
        if (event === 'INITIAL_SESSION') return

        console.log('[useAuth] onAuthStateChange:', event)

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setTenant(null)
          setProfileLoaded(false)
          setProfileError(null)
          return
        }

        if (session?.user) {
          setUser(session.user)
          // On token refresh, reload profile silently if needed
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            try {
              await loadProfile(session.user.id)
            } catch(e) {
              console.error('[useAuth] auth state change loadProfile error:', e)
            }
          }
        }
      }
    )

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [loadProfile])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    setTenant(null)
    setProfileLoaded(false)
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
      reloadProfile: () => user ? loadProfile(user.id) : Promise.resolve(),
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
