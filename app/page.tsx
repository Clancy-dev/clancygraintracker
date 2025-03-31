import { redirect } from "next/navigation"

export default function Home() {
  // Check if any users exist, if not redirect to signup, otherwise to login
  if (typeof window !== "undefined") {
    const storedUsers = localStorage.getItem("grainTrackerUsers")
    const users = storedUsers ? JSON.parse(storedUsers) : []

    if (users.length === 0) {
      redirect("/signup")
    } else {
      redirect("/login")
    }
  }

  // This will only run on the server
  redirect("/login")
}

