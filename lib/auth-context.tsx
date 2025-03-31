"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { AuthState, LoginCredentials, SignupCredentials, User } from "./auth-types"
// import type { AuthState, LoginCredentials, SignupCredentials, User } from "./auth-types"

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>
  signup: (credentials: SignupCredentials) => Promise<boolean>
  logout: () => void
  updateUser: (userData: Partial<User>) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  })

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("grainTrackerUser")
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
        })
      } catch (error) {
        console.error("Error parsing stored user:", error)
        localStorage.removeItem("grainTrackerUser")
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        })
      }
    } else {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  }, [])

  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    // First check if the user exists in the stored users
    const storedUsers = localStorage.getItem("grainTrackerUsers")
    const users = storedUsers ? JSON.parse(storedUsers) : []

    // Check if credentials match any stored user
    const matchedUser = users.find((user: User) => user.email === credentials.email)

    if (matchedUser) {
      // In a real app, we would verify the password hash here
      // For demo purposes, we'll just assume the password is correct

      // Update last login time
      const updatedUser = {
        ...matchedUser,
        lastLogin: new Date(),
      }

      // Update the user in the stored users list
      const updatedUsers = users.map((user: User) => (user.id === updatedUser.id ? updatedUser : user))

      // Save updated users list
      localStorage.setItem("grainTrackerUsers", JSON.stringify(updatedUsers))

      // Set the current user
      setAuthState({
        user: updatedUser,
        isAuthenticated: true,
        isLoading: false,
      })

      localStorage.setItem("grainTrackerUser", JSON.stringify(updatedUser))
      return true
    }

    // Demo admin account
    if (credentials.email === "admin@graintracker.com" && credentials.password === "admin123") {
      const adminUser: User = {
        id: "admin-1",
        name: "Admin User",
        email: "admin@graintracker.com",
        role: "admin",
        profileImage: "/admin-avatar.png",
        createdAt: new Date(),
        lastLogin: new Date(),
      }

      // Add admin to users list if not already there
      if (!users.find((u: User) => u.id === adminUser.id)) {
        users.push(adminUser)
        localStorage.setItem("grainTrackerUsers", JSON.stringify(users))
      }

      setAuthState({
        user: adminUser,
        isAuthenticated: true,
        isLoading: false,
      })

      localStorage.setItem("grainTrackerUser", JSON.stringify(adminUser))
      return true
    }

    // Demo normal user account
    if (credentials.email === "user@graintracker.com" && credentials.password === "user123") {
      const normalUser: User = {
        id: "user-1",
        name: "Normal User",
        email: "user@graintracker.com",
        role: "user",
        profileImage: "/user-avatar.png",
        createdAt: new Date(),
        lastLogin: new Date(),
      }

      // Add user to users list if not already there
      if (!users.find((u: User) => u.id === normalUser.id)) {
        users.push(normalUser)
        localStorage.setItem("grainTrackerUsers", JSON.stringify(users))
      }

      setAuthState({
        user: normalUser,
        isAuthenticated: true,
        isLoading: false,
      })

      localStorage.setItem("grainTrackerUser", JSON.stringify(normalUser))
      return true
    }

    return false
  }

  // Update the signup function to properly handle the first admin account
  const signup = async (credentials: SignupCredentials): Promise<boolean> => {
    // Get existing users
    const storedUsers = localStorage.getItem("grainTrackerUsers")
    const users = storedUsers ? JSON.parse(storedUsers) : []

    // Only allow admin signup if no users exist
    if (credentials.role === "admin" && users.length > 0) {
      return false
    }

    // Check if email already exists
    if (users.some((user: User) => user.email === credentials.email)) {
      return false
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: credentials.name,
      email: credentials.email,
      role: credentials.role,
      profileImage: "/default-avatar.png",
      createdAt: new Date(),
      lastLogin: new Date(),
    }

    // Add user to stored users
    users.push(newUser)
    localStorage.setItem("grainTrackerUsers", JSON.stringify(users))

    // Log in the new user
    setAuthState({
      user: newUser,
      isAuthenticated: true,
      isLoading: false,
    })

    localStorage.setItem("grainTrackerUser", JSON.stringify(newUser))
    return true
  }

  const logout = () => {
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    })
    localStorage.removeItem("grainTrackerUser")
  }

  const updateUser = async (userData: Partial<User>): Promise<boolean> => {
    if (!authState.user) return false

    const updatedUser = { ...authState.user, ...userData }

    // Update in localStorage
    localStorage.setItem("grainTrackerUser", JSON.stringify(updatedUser))

    // Also update in the users list
    const storedUsers = localStorage.getItem("grainTrackerUsers")
    if (storedUsers) {
      const users = JSON.parse(storedUsers)
      const updatedUsers = users.map((user: User) => (user.id === updatedUser.id ? updatedUser : user))
      localStorage.setItem("grainTrackerUsers", JSON.stringify(updatedUsers))
    }

    // Update in state
    setAuthState({
      ...authState,
      user: updatedUser,
    })

    return true
  }

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        signup,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

