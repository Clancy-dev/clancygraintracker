"use client"

import { useState } from "react"
import { AlertCircle, CalendarIcon, Plus, Search, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { useAppData } from "@/lib/data-store"
import { cn } from "@/lib/utils"
import type { NewInventory } from "@/lib/types"

export default function InventoryManagement() {
  const [open, setOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const { data, updateData, addHistoryEntry } = useAppData()

  const [newInventory, setNewInventory] = useState<NewInventory>({
    source: "",
    quantity: "",
    pricePerKg: "",
    date: new Date(),
  })

  const handleAddInventory = () => {
    if (!newInventory.source || !newInventory.quantity || !newInventory.pricePerKg) {
      toast.error("Missing information", {
        description: "Please fill in all required fields",
      })
      return
    }

    const quantity = Number.parseFloat(newInventory.quantity)
    const pricePerKg = Number.parseFloat(newInventory.pricePerKg)
    const totalCost = quantity * pricePerKg

    const inventory = {
      id: Date.now().toString(),
      source: newInventory.source,
      quantity: quantity,
      pricePerKg: pricePerKg,
      totalCost: totalCost,
      date: newInventory.date,
    }

    // Add to expenses
    const expense = {
      id: Date.now().toString() + "-inv",
      description: `Maize purchase from ${newInventory.source}`,
      amount: totalCost,
      category: "inventory",
      date: newInventory.date,
    }

    updateData({
      ...data,
      inventory: [...data.inventory, inventory],
      expenses: [...data.expenses, expense],
    })

    // Add to history
    addHistoryEntry({
      type: "inventory",
      description: `Purchased ${quantity}kg from ${newInventory.source}`,
      amount: totalCost,
      date: newInventory.date,
      details: { source: newInventory.source, quantity, pricePerKg },
    })

    toast.success("Inventory added", {
      description: "Your inventory has been recorded successfully",
    })

    setNewInventory({
      source: "",
      quantity: "",
      pricePerKg: "",
      date: new Date(),
    })

    setOpen(false)
  }

  const handleDeleteInventory = (id: string) => {
    const inventoryToDelete = data.inventory.find((item) => item.id === id)

    updateData({
      ...data,
      inventory: data.inventory.filter((item) => item.id !== id),
    })

    if (inventoryToDelete) {
      addHistoryEntry({
        type: "inventory",
        description: `Removed inventory from ${inventoryToDelete.source}`,
        amount: inventoryToDelete.totalCost,
        date: new Date(),
        details: { action: "deleted", quantity: inventoryToDelete.quantity },
      })
    }

    toast.success("Inventory deleted", {
      description: "The inventory item has been removed",
    })
  }

  const filteredInventory = data.inventory.filter((item) =>
    item.source.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const totalInventory = data.inventory.reduce((sum, item) => sum + item.quantity, 0)
  const totalInventoryValue = data.inventory.reduce((sum, item) => sum + item.quantity * item.pricePerKg, 0)
  const lowInventoryThreshold = 500 // kg
  const isLowInventory = totalInventory < lowInventoryThreshold

  return (
    <div className="grid gap-4 ">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Inventory Management</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Inventory
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Add New Inventory</DialogTitle>
              <DialogDescription>Record a new maize inventory purchase</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="source">Source/Supplier</Label>
                <Input
                  id="source"
                  placeholder="e.g., Mbale Farmers"
                  value={newInventory.source}
                  onChange={(e) => setNewInventory({ ...newInventory, source: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity (kg)</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="e.g., 1000"
                  value={newInventory.quantity}
                  onChange={(e) => setNewInventory({ ...newInventory, quantity: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pricePerKg">Price per kg (UGX)</Label>
                <Input
                  id="pricePerKg"
                  type="number"
                  placeholder="e.g., 1200"
                  value={newInventory.pricePerKg}
                  onChange={(e) => setNewInventory({ ...newInventory, pricePerKg: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Purchase Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newInventory.date ? format(newInventory.date, "PPP") : "Select a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newInventory.date}
                      onSelect={(date) => date && setNewInventory({ ...newInventory, date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddInventory}>Add Inventory</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLowInventory && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Low Inventory Alert</AlertTitle>
          <AlertDescription>
            Your maize inventory is below the recommended threshold of {lowInventoryThreshold.toLocaleString()} kg.
            Consider restocking soon.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Inventory</CardTitle>
            <CardDescription>Current maize stock</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalInventory.toLocaleString()} kg</div>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">Stock Level</span>
                <span className="text-sm font-medium">{Math.min(Math.round((totalInventory / 2000) * 100), 100)}%</span>
              </div>
              <Progress
                value={Math.min(Math.round((totalInventory / 2000) * 100), 100)}
                className={cn(isLowInventory ? "bg-red-200" : "bg-green-200")}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Value</CardTitle>
            <CardDescription>Total value of current stock</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">UGX {totalInventoryValue.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">Based on purchase prices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Cost</CardTitle>
            <CardDescription>Average cost per kg</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              UGX {totalInventory > 0 ? Math.round(totalInventoryValue / totalInventory).toLocaleString() : 0}
            </div>
            <p className="text-sm text-muted-foreground">Per kilogram of maize</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Records</CardTitle>
          <CardDescription>Manage your maize inventory</CardDescription>
          <div className="flex flex-col gap-4 pt-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by source..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price/kg</TableHead>
                <TableHead className="text-right">Total Cost</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    No inventory found. Add your first inventory to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{format(new Date(item.date), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{item.source}</TableCell>
                    <TableCell>{item.quantity.toLocaleString()} kg</TableCell>
                    <TableCell>UGX {item.pricePerKg.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      UGX {(item.quantity * item.pricePerKg).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteInventory(item.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredInventory.length} of {data.inventory.length} inventory items
          </div>
          <div className="font-medium">
            Total: {filteredInventory.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()} kg
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

