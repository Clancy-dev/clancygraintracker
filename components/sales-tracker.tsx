"use client"

import { useState } from "react"
import { CalendarIcon, Check, Plus, Search, Trash2, X } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { useAppData } from "@/lib/data-store"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { NewSale } from "@/lib/types"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

export default function SalesTracker() {
  const [open, setOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [paymentFilter, setPaymentFilter] = useState<string>("all")
  const { data, updateData, addHistoryEntry } = useAppData()

  const [newSale, setNewSale] = useState<NewSale>({
    customer: "",
    amount: "",
    quantity: "",
    isPaid: true,
    date: new Date(),
  })

  const handleAddSale = () => {
    if (!newSale.customer || !newSale.amount || !newSale.quantity) {
      toast.error("Missing information", {
        description: "Please fill in all required fields",
      })
      return
    }

    const sale = {
      id: Date.now().toString(),
      customer: newSale.customer,
      amount: Number.parseFloat(newSale.amount),
      quantity: Number.parseFloat(newSale.quantity),
      isPaid: newSale.isPaid,
      date: newSale.date,
    }

    // If not paid, add to debtors
    if (!newSale.isPaid) {
      const debtor = {
        id: Date.now().toString() + "-debt",
        name: newSale.customer,
        amount: Number.parseFloat(newSale.amount),
        date: newSale.date,
        dueDate: new Date(newSale.date.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days later
        description: `Sale of ${newSale.quantity} kg of maize`,
      }

      updateData({
        ...data,
        sales: [...data.sales, sale],
        debtors: [...data.debtors, debtor],
      })
    } else {
      updateData({
        ...data,
        sales: [...data.sales, sale],
      })
    }

    // Add to history
    addHistoryEntry({
      type: "sale",
      description: `Sale to ${newSale.customer}`,
      amount: Number.parseFloat(newSale.amount),
      date: newSale.date,
      details: {
        customer: newSale.customer,
        quantity: Number.parseFloat(newSale.quantity),
        isPaid: newSale.isPaid,
      },
    })

    // Update inventory
    if (data.inventory.length > 0) {
      const updatedInventory = [...data.inventory]
      const totalToRemove = Number.parseFloat(newSale.quantity)
      let remainingToRemove = totalToRemove

      for (let i = 0; i < updatedInventory.length && remainingToRemove > 0; i++) {
        if (updatedInventory[i].quantity <= remainingToRemove) {
          remainingToRemove -= updatedInventory[i].quantity
          updatedInventory[i].quantity = 0
        } else {
          updatedInventory[i].quantity -= remainingToRemove
          remainingToRemove = 0
        }
      }

      // Filter out empty inventory items
      const filteredInventory = updatedInventory.filter((item) => item.quantity > 0)

      updateData({
        ...data,
        inventory: filteredInventory,
      })
    }

    toast.success("Sale recorded", {
      description: "Your sale has been recorded successfully",
    })

    setNewSale({
      customer: "",
      amount: "",
      quantity: "",
      isPaid: true,
      date: new Date(),
    })

    setOpen(false)
  }

  const handleDeleteSale = (id: string) => {
    const sale = data.sales.find((s) => s.id === id)

    if (sale) {
      // If it was unpaid, also remove from debtors
      if (!sale.isPaid) {
        updateData({
          ...data,
          sales: data.sales.filter((s) => s.id !== id),
          debtors: data.debtors.filter((d) => d.name !== sale.customer || d.amount !== sale.amount),
        })
      } else {
        updateData({
          ...data,
          sales: data.sales.filter((s) => s.id !== id),
        })
      }

      // Add to history
      addHistoryEntry({
        type: "sale",
        description: `Deleted sale to ${sale.customer}`,
        amount: sale.amount,
        date: new Date(),
        details: { action: "deleted", customer: sale.customer },
      })

      toast.success("Sale deleted", {
        description: "The sale has been removed",
      })
    }
  }

  const handleTogglePaid = (id: string) => {
    const sale = data.sales.find((s) => s.id === id)
    if (!sale) return

    const updatedSales = data.sales.map((s) => {
      if (s.id === id) {
        return { ...s, isPaid: !s.isPaid }
      }
      return s
    })

    let updatedDebtors = [...data.debtors]

    // If changing from paid to unpaid, add to debtors
    if (sale.isPaid) {
      const debtor = {
        id: Date.now().toString() + "-debt",
        name: sale.customer,
        amount: sale.amount,
        date: sale.date,
        dueDate: new Date(sale.date.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days later
        description: `Sale of ${sale.quantity} kg of maize`,
      }
      updatedDebtors.push(debtor)

      // Add to history
      addHistoryEntry({
        type: "sale",
        description: `Marked sale to ${sale.customer} as unpaid`,
        amount: sale.amount,
        date: new Date(),
        details: { action: "marked-unpaid", customer: sale.customer },
      })
    }
    // If changing from unpaid to paid, remove from debtors
    else {
      updatedDebtors = updatedDebtors.filter(
        (d) => !(d.name === sale.customer && d.amount === sale.amount && d.description.includes(`${sale.quantity} kg`)),
      )

      // Add to history
      addHistoryEntry({
        type: "sale",
        description: `Marked sale to ${sale.customer} as paid`,
        amount: sale.amount,
        date: new Date(),
        details: { action: "marked-paid", customer: sale.customer },
      })
    }

    updateData({
      ...data,
      sales: updatedSales,
      debtors: updatedDebtors,
    })

    toast.success(sale.isPaid ? "Marked as unpaid" : "Marked as paid", {
      description: sale.isPaid
        ? `${sale.customer} has been added to debtors`
        : `Payment from ${sale.customer} has been recorded`,
    })
  }

  const filteredSales = data.sales.filter((sale) => {
    const matchesSearch = sale.customer.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesPayment =
      paymentFilter === "all" ||
      (paymentFilter === "paid" && sale.isPaid) ||
      (paymentFilter === "unpaid" && !sale.isPaid)
    return matchesSearch && matchesPayment
  })

  const totalFilteredSales = filteredSales.reduce((sum, sale) => sum + sale.amount, 0)
  const totalPaidSales = data.sales.filter((sale) => sale.isPaid).reduce((sum, sale) => sum + sale.amount, 0)
  const totalUnpaidSales = data.sales.filter((sale) => !sale.isPaid).reduce((sum, sale) => sum + sale.amount, 0)
  const totalQuantitySold = data.sales.reduce((sum, sale) => sum + sale.quantity, 0)

  // Prepare chart data
  const chartData = data.sales.reduce((acc: any[], sale) => {
    const dateStr = format(new Date(sale.date), "MMM dd")
    const existingEntry = acc.find((entry) => entry.date === dateStr)

    if (existingEntry) {
      existingEntry.amount += sale.amount
      existingEntry.quantity += sale.quantity
      if (sale.isPaid) {
        existingEntry.paid += sale.amount
      } else {
        existingEntry.unpaid += sale.amount
      }
    } else {
      acc.push({
        date: dateStr,
        amount: sale.amount,
        quantity: sale.quantity,
        paid: sale.isPaid ? sale.amount : 0,
        unpaid: sale.isPaid ? 0 : sale.amount,
      })
    }

    return acc
  }, [])

  // Sort by date
  chartData.sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return dateA.getTime() - dateB.getTime()
  })

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Sales Tracker</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Record Sale
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record New Sale</DialogTitle>
              <DialogDescription>Record a new sale of maize</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="customer">Customer Name</Label>
                <Input
                  id="customer"
                  placeholder="e.g., Kampala Traders"
                  value={newSale.customer}
                  onChange={(e) => setNewSale({ ...newSale, customer: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity (kg)</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="e.g., 500"
                  value={newSale.quantity}
                  onChange={(e) => setNewSale({ ...newSale, quantity: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount (UGX)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="e.g., 350000"
                  value={newSale.amount}
                  onChange={(e) => setNewSale({ ...newSale, amount: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="isPaid" className="flex-1">
                  Payment Received
                </Label>
                <Switch
                  id="isPaid"
                  checked={newSale.isPaid}
                  onCheckedChange={(checked) => setNewSale({ ...newSale, isPaid: checked })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newSale.date ? format(newSale.date, "PPP") : "Select a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newSale.date}
                      onSelect={(date) => date && setNewSale({ ...newSale, date })}
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
              <Button onClick={handleAddSale}>Record Sale</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Sales</CardTitle>
            <CardDescription>All sales (paid and unpaid)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              UGX {data.sales.reduce((sum, sale) => sum + sale.amount, 0).toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">{data.sales.length} sales recorded</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Paid Sales</CardTitle>
            <CardDescription>Revenue received</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">UGX {totalPaidSales.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">
              {data.sales.filter((sale) => sale.isPaid).length} paid transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Unpaid Sales</CardTitle>
            <CardDescription>Outstanding payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-500">UGX {totalUnpaidSales.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">
              {data.sales.filter((sale) => !sale.isPaid).length} unpaid transactions
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Overview</CardTitle>
          <CardDescription>Sales by date</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`UGX ${value.toLocaleString()}`, ""]} />
                <Legend />
                <Bar dataKey="paid" name="Paid Sales" stackId="a" fill="#10b981" />
                <Bar dataKey="unpaid" name="Unpaid Sales" stackId="a" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sales Records</CardTitle>
          <CardDescription>Manage and filter your sales records</CardDescription>
          <div className="flex flex-col gap-4 pt-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by customer..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sales</SelectItem>
                <SelectItem value="paid">Paid Only</SelectItem>
                <SelectItem value="unpaid">Unpaid Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                    No sales found. Record your first sale to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{format(new Date(sale.date), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{sale.customer}</TableCell>
                    <TableCell>{sale.quantity.toLocaleString()} kg</TableCell>
                    <TableCell className="text-right">UGX {sale.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <div
                        className={cn(
                          "flex items-center justify-center w-24 rounded-full px-2.5 py-0.5 text-xs font-medium",
                          sale.isPaid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700",
                        )}
                      >
                        {sale.isPaid ? <Check className="mr-1 h-3 w-3" /> : <X className="mr-1 h-3 w-3" />}
                        {sale.isPaid ? "Paid" : "Unpaid"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleTogglePaid(sale.id)}>
                          {sale.isPaid ? "Mark Unpaid" : "Mark Paid"}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteSale(sale.id)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {filteredSales.length} of {data.sales.length} sales
          </div>
          <div className="font-medium">
            Total: UGX {totalFilteredSales.toLocaleString()} (
            {filteredSales.reduce((sum, sale) => sum + sale.quantity, 0).toLocaleString()} kg)
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

