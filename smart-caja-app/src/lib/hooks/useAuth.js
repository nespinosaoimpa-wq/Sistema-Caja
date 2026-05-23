'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [tenant, setTenant] = useState(null)
  const [currentBranch, setCurrentBranchState] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

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
    const { data: profileData, error } = await supabase
      .from('profiles')
      .select(`
        *,
        tenants (*)
      `)
      .eq('id', userId)
      .single()

    if (!error && profileData) {
      setProfile(profileData)
      setTenant(profileData.tenants)

      // Apply tenant theme to CSS variables
      if (profileData.tenants?.theme_config) {
        const theme = profileData.tenants.theme_config
        document.documentElement.style.setProperty(
          '--color-primary', theme.primary_color || '#7C3AED'
        )
        document.documentElement.style.setProperty(
          '--color-secondary', theme.secondary_color || '#10B981'
        )
      }
    }
  }, [supabase])

  useEffect(() => {
    const getSession = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)
      if (currentUser) {
        await loadProfile(currentUser.id)
      }
      setLoading(false)
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          await loadProfile(session.user.id)
        } else {
          setProfile(null)
          setTenant(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, loadProfile])

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
