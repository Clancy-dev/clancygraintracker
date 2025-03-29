import { Suspense } from "react"
import LoadingScreen from "@/components/loading-screen"
import Dashboard from "@/components/dashboard"

export default function Home() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Dashboard />
    </Suspense>
  )
}

