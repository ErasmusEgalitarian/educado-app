import { AsyncStore } from '@/utils/async-store'
import { syncAllProgress } from '@/utils/progress-sync'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import React, { createContext, useContext, useEffect, useRef } from 'react'

interface User {
  id: string
  username: string
  createdAt: string
}

interface UserContextType {
  user: User | null
  isLoading: boolean
  login: (username: string) => Promise<void>
  logout: () => Promise<void>
  isLoggingIn: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

const USER_STORAGE_KEY = 'educado_user'

async function fetchStoredUser(): Promise<User | null> {
  try {
    const storedUser = await AsyncStore.get(USER_STORAGE_KEY)
    if (storedUser) {
      return JSON.parse(storedUser)
    }
    return null
  } catch (error) {
    console.error('Error loading user:', error)
    return null
  }
}

async function loginUser(username: string): Promise<User> {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL

  const response = await fetch(`${apiUrl}/user/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to login')
  }

  const userData = await response.json()
  await AsyncStore.set(USER_STORAGE_KEY, JSON.stringify(userData))
  return userData
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const hasSyncedOnMount = useRef(false)

  // Load user from storage on mount
  const { data: user = null, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: fetchStoredUser,
    staleTime: Infinity,
    gcTime: Infinity,
  })

  // Sync progress and certificates when user is loaded
  useEffect(() => {
    if (user && !hasSyncedOnMount.current) {
      hasSyncedOnMount.current = true
      console.log('🔄 Syncing progress and certificates on app start...')
      syncAllProgress().catch((error) => {
        console.error('Failed to sync on mount:', error)
      })
    }
  }, [user])

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: async (userData) => {
      queryClient.setQueryData(['user'], userData)
      // Sync progress and certificates after successful login
      console.log('🔄 Syncing progress and certificates after login...')
      try {
        await syncAllProgress()
        console.log('✅ Sync completed after login')
      } catch (error) {
        console.error('Failed to sync after login:', error)
      }
    },
  })

  const login = async (username: string) => {
    await loginMutation.mutateAsync(username)
  }

  const logout = async () => {
    try {
      await AsyncStore.clear(USER_STORAGE_KEY)
      queryClient.setQueryData(['user'], null)
      queryClient.invalidateQueries({ queryKey: ['user'] })
      hasSyncedOnMount.current = false
    } catch (error) {
      console.error('Error logging out:', error)
      throw error
    }
  }

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        isLoggingIn: loginMutation.isPending,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}
