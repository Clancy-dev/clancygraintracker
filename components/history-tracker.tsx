"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAppData } from "@/lib/data-store"
import type { HistoryEntry } from "@/lib/types"
import { CreditCard, ShoppingCart, Package, Users, TrendingUp, ArrowRight } from "lucide-react"

export default function HistoryTracker() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const { getHistoryForDate } = useAppData()

  const historyEntries = selectedDate ? getHistoryForDate(selectedDate) : []

  const getIconForType = (type: string) => {
    switch (type) {
      case "expense":
        return <CreditCard className="h-4 w-4 text-red-500" />
      case "sale":
        return <ShoppingCart className="h-4 w-4 text-green-500" />
      case "inventory":
        return <Package className="h-4 w-4 text-blue-500" />
      case "debt":
        return <Users className="h-4 w-4 text-amber-500" />
      case "marketPrice":
        return <TrendingUp className="h-4 w-4 text-purple-500" />
      default:
        return <ArrowRight className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "expense":
        return "Expense"
      case "sale":
        return "Sale"
      case "inventory":
        return "Inventory"
      case "debt":
        return "Debt"
      case "marketPrice":
        return "Market Price"
      default:
        return type
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Calendar</CardTitle>
          <CardDescription>Select a date to view history</CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} className="rounded-md border" />
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>History for {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Selected Date"}</CardTitle>
          <CardDescription>All transactions and activities on this date</CardDescription>
        </CardHeader>
        <CardContent>
          {historyEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No activities recorded for this date</div>
          ) : (
            <div className="space-y-4">
              {historyEntries.map((entry: HistoryEntry) => (
                <div key={entry.id} className="flex items-start border-b pb-4">
                  <div className="mr-4 mt-1 rounded-full bg-muted p-2">{getIconForType(entry.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">{entry.description}</h4>
                      <span
                        className={`text-sm font-medium ${entry.type === "expense" || (entry.type === "debt" && entry.details.type === "creditor") ? "text-red-500" : "text-green-500"}`}
                      >
                        {entry.type === "expense" || (entry.type === "debt" && entry.details.type === "creditor")
                          ? "-"
                          : "+"}
                        UGX {entry.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">
                        {getTypeLabel(entry.type)} • {format(new Date(entry.date), "h:mm a")}
                      </span>
                      {entry.details && entry.details.action && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{entry.details.action}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

