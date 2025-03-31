"use client"

import { useEffect, useState } from "react"
// import LoginForm from "@/components/auth/login-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import LoginForm from "@/components/auth/login-form"
import { Wheat } from "lucide-react"

export default function LoginPage() {
  const [hasUsers, setHasUsers] = useState(true)

  useEffect(() => {
    // Check if any users exist
    const storedUsers = localStorage.getItem("grainTrackerUsers")
    const users = storedUsers ? JSON.parse(storedUsers) : []
    setHasUsers(users.length > 0)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Wheat className="h-6 w-6 text-amber-500" />
            {/* <Image src="/logo.png" alt="Grain Tracker Logo" width={80} height={80} className="mx-auto" /> */}
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Grain Tracker</h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account to manage your maize business</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>

        <div className="text-center mt-4">
          {!hasUsers ? (
            <p className="text-sm text-gray-600">
              First time?{" "}
              <Link href="/signup" className="text-amber-600 hover:text-amber-500">
                Create admin account
              </Link>
            </p>
          ) : (
            <p className="text-sm text-gray-600">Don't have an account? Contact your administrator</p>
          )}

          {hasUsers && (
            <p className="text-xs text-gray-500 mt-4">
              For demo purposes: <br />
              Admin: admin@graintracker.com / admin123 <br />
              User: user@graintracker.com / user123
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

