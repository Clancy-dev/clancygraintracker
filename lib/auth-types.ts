export interface User {
    id: string
    name: string
    email: string
    role: "admin" | "user"
    profileImage?: string
    createdAt: Date
    lastLogin?: Date
  }
  
  export interface AuthState {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
  }
  
  export interface LoginCredentials {
    email: string
    password: string
  }
  
  export interface SignupCredentials {
    name: string
    email: string
    password: string
    role: "admin" | "user"
  }
  
  export interface DeletedItem {
    id: string
    itemType: "expense" | "sale" | "inventory" | "debt" | "marketPrice"
    data: any
    deletedBy: string
    deletedAt: Date
    restoredAt?: Date
    restoredBy?: string
  }
  
  