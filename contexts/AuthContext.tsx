import {
  ApiError,
  ApiUser,
  apiGetUserInfo,
  apiLogin,
  apiStudentRegister,
  apiStudentDeviceLogin,
  apiStudentEmailLogin,
  getOrCreateDeviceId,
  getStoredToken,
  getStoredUser,
  removeToken,
  removeUser,
  storeToken,
  storeUser,
} from '@/services/api'
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

interface AuthState {
  user: ApiUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  loginByEmail: (email: string) => Promise<void>
  registerStudent: (data: {
    firstName: string
    lastName: string
    email?: string
    phone?: string
    dateOfBirth?: string
  }) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  })

  // Restore session on app start
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await getStoredToken()
        const user = await getStoredUser()

        if (token && user) {
          // We have a stored session — trust it, validate in background
          setState({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          })

          // Validate token in background (don't block UI)
          try {
            await apiGetUserInfo()
          } catch (error) {
            if (error instanceof ApiError && error.status === 401) {
              // Token expired — try device login
              try {
                const deviceId = await getOrCreateDeviceId()
                const result = await apiStudentDeviceLogin(deviceId)
                const freshUser: ApiUser = {
                  id: result.user.id,
                  firstName: result.user.firstName,
                  lastName: result.user.lastName,
                  email: user.email || '',
                  username: null,
                  avatarMediaId: null,
                }
                await storeToken(result.accessToken)
                await storeUser(freshUser)
                setState({
                  user: freshUser,
                  token: result.accessToken,
                  isAuthenticated: true,
                  isLoading: false,
                })
              } catch {
                // Device login also failed — log out
                await removeToken()
                await removeUser()
                setState({
                  user: null,
                  token: null,
                  isAuthenticated: false,
                  isLoading: false,
                })
              }
            }
            // Network errors: keep using cached user
          }
        } else {
          // No stored session
          setState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          })
        }
      } catch {
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        })
      }
    }

    restoreSession()
  }, [])

  // Legacy login (email + password — for creators)
  const login = useCallback(async (email: string, password: string) => {
    const response = await apiLogin(email, password)
    await storeToken(response.accessToken)

    const user: ApiUser = {
      id: response.user.id,
      firstName: response.user.firstName,
      lastName: response.user.lastName,
      email: response.user.email || email,
      username: null,
      avatarMediaId: response.user.avatarMediaId || null,
    }
    await storeUser(user)

    setState({
      user,
      token: response.accessToken,
      isAuthenticated: true,
      isLoading: false,
    })
  }, [])

  // Login by email only — find existing student account
  const loginByEmail = useCallback(async (email: string) => {
    const response = await apiStudentEmailLogin(email)

    const user: ApiUser = {
      id: response.user.id,
      firstName: response.user.firstName,
      lastName: response.user.lastName,
      email,
      username: null,
      avatarMediaId: null,
    }

    await storeToken(response.accessToken)
    await storeUser(user)

    setState({
      user,
      token: response.accessToken,
      isAuthenticated: true,
      isLoading: false,
    })
  }, [])

  // Student registration (simplified, no password)
  const registerStudent = useCallback(
    async (data: {
      firstName: string
      lastName: string
      email?: string
      phone?: string
      dateOfBirth?: string
    }) => {
      const deviceId = await getOrCreateDeviceId()
      const response = await apiStudentRegister({ ...data, deviceId })

      const user: ApiUser = {
        id: response.user.id,
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        email: data.email || '',
        username: null,
        avatarMediaId: null,
      }

      await storeToken(response.accessToken)
      await storeUser(user)

      setState({
        user,
        token: response.accessToken,
        isAuthenticated: true,
        isLoading: false,
      })
    },
    []
  )

  const logout = useCallback(async () => {
    await removeToken()
    await removeUser()
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    })
  }, [])

  return (
    <AuthContext.Provider
      value={{ ...state, login, loginByEmail, registerStudent, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
