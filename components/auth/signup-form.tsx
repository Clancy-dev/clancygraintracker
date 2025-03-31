"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"
import type { SignupCredentials } from "@/lib/auth-types"
import Link from "next/link"

interface SignupFormProps {
  isAdmin?: boolean
}

export default function SignupForm({ isAdmin = false }: SignupFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { signup } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupCredentials & { confirmPassword: string }>({
    defaultValues: {
      role: isAdmin ? "admin" : "user",
    },
  })

  const password = watch("password", "")

  const onSubmit = async (data: SignupCredentials & { confirmPassword: string }) => {
    setIsLoading(true)

    try {
      // Check if passwords match
      if (data.password !== data.confirmPassword) {
        toast.error("Passwords do not match")
        setIsLoading(false)
        return
      }

      const success = await signup({
        name: data.name,
        email: data.email,
        password: data.password,
        role: isAdmin ? "admin" : "user",
      })

      if (success) {
        toast.success("Account created successfully!")
        router.push("/dashboard")
      } else {
        toast.error("Failed to create account")
      }
    } catch (error) {
      toast.error("An error occurred during signup")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          placeholder="Enter your full name"
          {...register("name", { required: "Full name is required" })}
        />
        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
      </div>

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
          placeholder="Create a password"
          {...register("password", {
            required: "Password is required",
            minLength: {
              value: 6,
              message: "Password must be at least 6 characters",
            },
          })}
        />
        {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          {...register("confirmPassword", {
            required: "Please confirm your password",
            validate: (value) => value === password || "Passwords do not match",
          })}
        />
        {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <div className="flex items-center">
            <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full"></div>
            Creating account...
          </div>
        ) : isAdmin ? (
          "Create Admin Account"
        ) : (
          "Sign Up"
        )}
      </Button>

      <div className="text-center text-sm">
        <p>
          Already have an account?{" "}
          <Link href="/login" className="text-amber-600 hover:text-amber-500">
            Sign in
          </Link>
        </p>
      </div>
    </form>
  )
}

