"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
// import SignupForm from "@/components/auth/signup-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import SignupForm from "@/components/auth/signup-form"

export default function SignupPage() {
  const [isFirstUser, setIsFirstUser] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if any users exist
    const storedUsers = localStorage.getItem("grainTrackerUsers")
    const users = storedUsers ? JSON.parse(storedUsers) : []

    // If users exist, this is not the first user
    setIsFirstUser(users.length === 0)
    setIsLoading(false)

    // If users exist, redirect to login
    if (users.length > 0) {
      setTimeout(() => {
        router.push("/login")
      }, 3000) // Redirect after 3 seconds
    }
  }, [router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Image src="/logo.png" alt="Grain Tracker Logo" width={80} height={80} className="mx-auto" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Grain Tracker</h2>
          <p className="mt-2 text-sm text-gray-600">
            {isFirstUser ? "Create your admin account to get started" : "Admin account already exists"}
          </p>
        </div>

        {isFirstUser ? (
          <Card>
            <CardHeader>
              <CardTitle>Create Admin Account</CardTitle>
              <CardDescription>
                This will be the main administrator account with full access to all features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SignupForm isAdmin={true} />
            </CardContent>
          </Card>
        ) : (
          <>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription>
                An admin account already exists. Please log in or contact your administrator. Redirecting to login
                page...
              </AlertDescription>
            </Alert>

            <div className="text-center mt-4">
              <Link href="/login" className="text-amber-600 hover:text-amber-500">
                Go to Login Page
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

