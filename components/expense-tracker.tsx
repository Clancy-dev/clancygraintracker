"use client"

import { useState } from "react"
import { CalendarIcon, Plus, Search, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { toast } from "sonner"
import { useAppData } from "@/lib/data-store"
import type { NewExpense } from "@/lib/types"

export default function ExpenseTracker() {
  const [open, setOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const { data, updateData } = useAppData()

  const [newExpense, setNewExpense] = useState<NewExpense>({
    description: "",
    amount: "",
    category: "fuel",
    date: new Date(),
  })

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount) {
      toast.error("Missing information", {
        description: "Please fill in all required fields",
      })
      return
    }

    const expense = {
      id: Date.now().toString(),
      description: newExpense.description,
      amount: Number.parseFloat(newExpense.amount),
      category: newExpense.category,
      date: newExpense.date,
    }

    updateData({
      ...data,
      expenses: [...data.expenses, expense],
    })

    toast.success("Expense added", {
      description: "Your expense has been recorded successfully",
    })

    setNewExpense({
      description: "",
      amount: "",
      category: "fuel",
      date: new Date(),
    })

    setOpen(false)
  }

  const handleDeleteExpense = (id: string) => {
    updateData({
      ...data,
      expenses: data.expenses.filter((expense) => expense.id !== id),
    })

    toast.success("Expense deleted", {
      description: "The expense has been removed",
    })
  }

  const filteredExpenses = data.expenses.filter((expense) => {
    const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || expense.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const totalFilteredExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Expense Tracker</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>Add New Expense</DialogTitle>
              <DialogDescription>Record a new expense for your maize business</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="e.g., Fuel for transportation"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount (UGX)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="e.g., 50000"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newExpense.category}
                  onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="fuel">Fuel</SelectItem>
                    <SelectItem value="labor">Labor</SelectItem>
                    <SelectItem value="transportation">Transportation</SelectItem>
                    <SelectItem value="packaging">Packaging</SelectItem>
                    <SelectItem value="storage">Storage</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newExpense.date ? format(newExpense.date, "PPP") : "Select a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newExpense.date}
                      onSelect={(date) => date && setNewExpense({ ...newExpense, date: date })}
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
              <Button onClick={handleAddExpense}>Add Expense</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col gap-4 md:flex-row">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Expense Summary</CardTitle>
            <CardDescription>Overview of your business expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              UGX {data.expenses.reduce((sum, expense) => sum + expense.amount, 0).toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">Total expenses recorded</p>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
            <CardDescription>Breakdown by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {["fuel", "labor", "transportation", "packaging", "storage", "other"].map((category) => {
                const total = data.expenses
                  .filter((expense) => expense.category === category)
                  .reduce((sum, expense) => sum + expense.amount, 0)

                const percentage = data.expenses.length
                  ? (total / data.expenses.reduce((sum, expense) => sum + expense.amount, 0)) * 100
                  : 0

                return (
                  <div key={category} className="flex items-center">
                    <div className="w-24 capitalize">{category}</div>
                    <div className="flex-1 mx-2">
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div className="h-full rounded-full bg-amber-500" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                    <div className="w-20 text-right">UGX {total.toLocaleString()}</div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Records</CardTitle>
          <CardDescription>Manage and filter your expense records</CardDescription>
          <div className="flex flex-col gap-4 pt-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="fuel">Fuel</SelectItem>
                <SelectItem value="labor">Labor</SelectItem>
                <SelectItem value="transportation">Transportation</SelectItem>
                <SelectItem value="packaging">Packaging</SelectItem>
                <SelectItem value="storage">Storage</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    No expenses found. Add your first expense to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{format(new Date(expense.date), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell className="capitalize">{expense.category}</TableCell>
                    <TableCell className="text-right">UGX {expense.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteExpense(expense.id)}>
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
            Showing {filteredExpenses.length} of {data.expenses.length} expenses
          </div>
          <div className="font-medium">Total: UGX {totalFilteredExpenses.toLocaleString()}</div>
        </CardFooter>
      </Card>
    </div>
  )
}

