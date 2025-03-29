"use client"

import { useEffect, useState } from "react"
import { Loader2, Wheat } from "lucide-react"

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState("Loading your grain data...")

  useEffect(() => {
    const messages = [
      "Loading your grain data...",
      "Preparing your dashboard...",
      "Calculating profits...",
      "Analyzing market trends...",
      "Almost ready...",
    ]

    let timer: NodeJS.Timeout

    const updateProgress = () => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 15
        if (newProgress >= 100) {
          clearInterval(timer)
          return 100
        }

        // Change message at certain progress points
        if (prev < 20 && newProgress >= 20) setMessage(messages[1])
        else if (prev < 40 && newProgress >= 40) setMessage(messages[2])
        else if (prev < 60 && newProgress >= 60) setMessage(messages[3])
        else if (prev < 80 && newProgress >= 80) setMessage(messages[4])

        return newProgress
      })
    }

    timer = setInterval(updateProgress, 500)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4 max-w-[80%] text-center">
        <Wheat className="h-16 w-16 text-amber-500 animate-pulse" />
        <h1 className="text-3xl font-bold tracking-tight">Grain Tracker</h1>
        <p className="text-muted-foreground">{message}</p>

        <div className="w-64 h-2 bg-muted rounded-full mt-4 overflow-hidden">
          <div className="h-full bg-amber-500 transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
        </div>

        <div className="flex items-center gap-2 mt-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  )
}

