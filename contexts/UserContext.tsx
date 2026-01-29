import { AsyncStore } from '@/utils/async-store'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import React, { createContext, useContext } from 'react'

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

  // Load user from storage on mount
  const { data: user = null, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: fetchStoredUser,
    staleTime: Infinity,
    gcTime: Infinity,
  })

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (userData) => {
      queryClient.setQueryData(['user'], userData)
    },
  })

  const login = async (username: string) => {
    await loginMutation.mutateAsync(username)
  }

  const logout = async () => {
    try {
      await AsyncStore.clear(USER_STORAGE_KEY)
      queryClient.setQueryData(['user'], null)
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
