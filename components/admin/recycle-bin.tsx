"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getRecycleBin, permanentlyDeleteFromRecycleBin, restoreFromRecycleBin } from "@/lib/recycle-bin"
import type { DeletedItem } from "@/lib/auth-types"
import { ArrowLeft, RefreshCw, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import Link from "next/link"
import { useAppData } from "@/lib/data-store"

export default function RecycleBin() {
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([])
  const [filteredItems, setFilteredItems] = useState<DeletedItem[]>([])
  const [itemTypeFilter, setItemTypeFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const { user } = useAuth()
  const router = useRouter()
  const { data, updateData } = useAppData()

  useEffect(() => {
    // Load deleted items from localStorage
    const items = getRecycleBin()
    setDeletedItems(items)
    setFilteredItems(items)
  }, [])

  useEffect(() => {
    // Apply filters
    let filtered = deletedItems

    if (itemTypeFilter !== "all") {
      filtered = filtered.filter((item) => item.itemType === itemTypeFilter)
    }

    if (searchQuery) {
      filtered = filtered.filter((item) => JSON.stringify(item.data).toLowerCase().includes(searchQuery.toLowerCase()))
    }

    setFilteredItems(filtered)
  }, [deletedItems, itemTypeFilter, searchQuery])

  const handleRestore = (id: string) => {
    if (!user) return

    const restoredItem = restoreFromRecycleBin(id, user.id)

    if (restoredItem) {
      // Update the app data based on the item type
      const updatedData = { ...data }

      const item = deletedItems.find((item) => item.id === id)
      if (!item) return

      switch (item.itemType) {
        case "expense":
          updatedData.expenses = [...updatedData.expenses, restoredItem]
          break
        case "sale":
          updatedData.sales = [...updatedData.sales, restoredItem]
          break
        case "inventory":
          updatedData.inventory = [...updatedData.inventory, restoredItem]
          break
        case "debt":
          // Check if it's a debtor or creditor
          if (restoredItem.name) {
            if ("dueDate" in restoredItem) {
              updatedData.debtors = [...updatedData.debtors, restoredItem]
            } else {
              updatedData.creditors = [...updatedData.creditors, restoredItem]
            }
          }
          break
        case "marketPrice":
          updatedData.marketPrices = [...updatedData.marketPrices, restoredItem]
          break
      }

      updateData(updatedData)

      // Update the local state
      setDeletedItems(getRecycleBin())

      toast.success("Item restored successfully")
    } else {
      toast.error("Failed to restore item")
    }
  }

  const handlePermanentDelete = (id: string) => {
    const success = permanentlyDeleteFromRecycleBin(id)

    if (success) {
      setDeletedItems(getRecycleBin())
      toast.success("Item permanently deleted")
    } else {
      toast.error("Failed to delete item")
    }
  }

  const getItemTypeLabel = (type: string) => {
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

  const getItemDescription = (item: DeletedItem) => {
    const data = item.data

    switch (item.itemType) {
      case "expense":
        return `${data.description} (${data.category})`
      case "sale":
        return `Sale to ${data.customer}`
      case "inventory":
        return `${data.quantity}kg from ${data.source}`
      case "debt":
        return `${data.name}: ${data.description}`
      case "marketPrice":
        return `${data.market}: ${data.price} UGX/kg`
      default:
        return "Unknown item"
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/dashboard" className="flex items-center text-amber-600 hover:text-amber-700">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recycle Bin</CardTitle>
          <CardDescription>View and restore deleted items. Only administrators can access this area.</CardDescription>

          <div className="flex flex-col gap-4 pt-4 md:flex-row">
            <div className="relative flex-1">
              <Input
                placeholder="Search deleted items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={itemTypeFilter} onValueChange={setItemTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="expense">Expenses</SelectItem>
                <SelectItem value="sale">Sales</SelectItem>
                <SelectItem value="inventory">Inventory</SelectItem>
                <SelectItem value="debt">Debts</SelectItem>
                <SelectItem value="marketPrice">Market Prices</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Deleted By</TableHead>
                <TableHead>Deleted At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No deleted items found
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{getItemTypeLabel(item.itemType)}</TableCell>
                    <TableCell>{getItemDescription(item)}</TableCell>
                    <TableCell>{item.deletedBy}</TableCell>
                    <TableCell>
                      {new Date(item.deletedAt).toLocaleDateString()}{" "}
                      {new Date(item.deletedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleRestore(item.id)}>
                          <RefreshCw className="mr-1 h-3 w-3" />
                          Restore
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handlePermanentDelete(item.id)}>
                          <Trash2 className="mr-1 h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

