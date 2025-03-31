"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import type { LoginCredentials } from "@/lib/auth-types"

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { login } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<LoginCredentials>()

  const onSubmit = async (data: LoginCredentials) => {
    setIsLoading(true)

    try {
      const success = await login(data)

      if (success) {
        toast.success("Login successful!")
        router.push("/dashboard")
      } else {
        toast.error("Invalid credentials")
      }
    } catch (error) {
      toast.error("An error occurred during login")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const loginAsDemo = (role: "admin" | "user") => {
    if (role === "admin") {
      setValue("email", "admin@graintracker.com")
      setValue("password", "admin123")
    } else {
      setValue("email", "user@graintracker.com")
      setValue("password", "user123")
    }
  }

  return (
    <div className="space-y-6 bg-white">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              },
            })}
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            {...register("password", { required: "Password is required" })}
          />
          {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm">
            <a href="#" className="text-amber-600 hover:text-amber-500">
              Forgot your password?
            </a>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <div className="flex items-center">
              <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
              Signing in...
            </div>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Quick Access</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" onClick={() => loginAsDemo("admin")} className="w-full">
          Sign in as Admin
        </Button>
        <Button variant="outline" onClick={() => loginAsDemo("user")} className="w-full">
          Sign in as User
        </Button>
      </div>
    </div>
  )
}

