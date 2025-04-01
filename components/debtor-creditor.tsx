"use client"

import { useState } from "react"
import { AlertCircle, CalendarIcon, Check, Plus, Search, Trash2 } from "lucide-react"
import { format, isAfter, addDays } from "date-fns"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAppData } from "@/lib/data-store"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { NewDebt } from "@/lib/types"

export default function DebtorCreditor() {
  const [open, setOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("debtors")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { data, updateData, addHistoryEntry } = useAppData()

  const [newDebt, setNewDebt] = useState<NewDebt>({
    name: "",
    amount: "",
    description: "",
    date: new Date(),
    dueDate: addDays(new Date(), 14),
    type: "debtor", // debtor or creditor
  })

  const handleAddDebt = () => {
    if (!newDebt.name || !newDebt.amount || !newDebt.description) {
      toast.error("Missing information", {
        description: "Please fill in all required fields",
      })
      return
    }

    const debt = {
      id: Date.now().toString(),
      name: newDebt.name,
      amount: Number.parseFloat(newDebt.amount),
      description: newDebt.description,
      date: newDebt.date,
      dueDate: newDebt.dueDate,
    }

    if (newDebt.type === "debtor") {
      updateData({
        ...data,
        debtors: [...data.debtors, debt],
      })

      // Add to history
      addHistoryEntry({
        type: "debt",
        description: `Added debtor: ${newDebt.name}`,
        amount: Number.parseFloat(newDebt.amount),
        date: newDebt.date,
        details: { type: "debtor", description: newDebt.description },
      })

      toast.success("Debtor added", {
        description: `${newDebt.name} has been added to your debtors list`,
      })
    } else {
      updateData({
        ...data,
        creditors: [...data.creditors, debt],
      })

      // Add to history
      addHistoryEntry({
        type: "debt",
        description: `Added creditor: ${newDebt.name}`,
        amount: Number.parseFloat(newDebt.amount),
        date: newDebt.date,
        details: { type: "creditor", description: newDebt.description },
      })

      toast.success("Creditor added", {
        description: `${newDebt.name} has been added to your creditors list`,
      })
    }

    setNewDebt({
      name: "",
      amount: "",
      description: "",
      date: new Date(),
      dueDate: addDays(new Date(), 14),
      type: "debtor",
    })

    setOpen(false)
  }

  const handleDeleteDebt = (id: string, type: "debtor" | "creditor") => {
    if (type === "debtor") {
      const debtorToDelete = data.debtors.find((d) => d.id === id)
      updateData({
        ...data,
        debtors: data.debtors.filter((debtor) => debtor.id !== id),
      })

      if (debtorToDelete) {
        addHistoryEntry({
          type: "debt",
          description: `Removed debtor: ${debtorToDelete.name}`,
          amount: debtorToDelete.amount,
          date: new Date(),
          details: { type: "debtor", action: "deleted" },
        })
      }

      toast.success("Debtor removed", {
        description: "The debtor has been removed from your list",
      })
    } else {
      const creditorToDelete = data.creditors.find((c) => c.id === id)
      updateData({
        ...data,
        creditors: data.creditors.filter((creditor) => creditor.id !== id),
      })

      if (creditorToDelete) {
        addHistoryEntry({
          type: "debt",
          description: `Removed creditor: ${creditorToDelete.name}`,
          amount: creditorToDelete.amount,
          date: new Date(),
          details: { type: "creditor", action: "deleted" },
        })
      }

      toast.success("Creditor removed", {
        description: "The creditor has been removed from your list",
      })
    }
  }

  const handleMarkAsPaid = (id: string, type: "debtor" | "creditor") => {
    if (type === "debtor") {
      const debtorToPay = data.debtors.find((d) => d.id === id)
      updateData({
        ...data,
        debtors: data.debtors.filter((debtor) => debtor.id !== id),
      })

      if (debtorToPay) {
        addHistoryEntry({
          type: "debt",
          description: `Payment received from: ${debtorToPay.name}`,
          amount: debtorToPay.amount,
          date: new Date(),
          details: { type: "debtor", action: "paid" },
        })
      }

      toast.success("Payment received", {
        description: "The debt has been marked as paid",
      })
    } else {
      const creditorToPay = data.creditors.find((c) => c.id === id)
      updateData({
        ...data,
        creditors: data.creditors.filter((creditor) => creditor.id !== id),
      })

      if (creditorToPay) {
        addHistoryEntry({
          type: "debt",
          description: `Payment made to: ${creditorToPay.name}`,
          amount: creditorToPay.amount,
          date: new Date(),
          details: { type: "creditor", action: "paid" },
        })
      }

      toast.success("Payment made", {
        description: "The debt has been marked as paid",
      })
    }
  }

  const getDebtStatus = (dueDate: Date) => {
    const today = new Date()
    if (isAfter(today, dueDate)) {
      return "overdue"
    } else if (isAfter(today, addDays(dueDate, -3))) {
      return "due-soon"
    } else {
      return "upcoming"
    }
  }

  const filteredDebtors = data.debtors.filter((debtor) => {
    const matchesSearch = debtor.name.toLowerCase().includes(searchQuery.toLowerCase())
    const status = getDebtStatus(new Date(debtor.dueDate))
    const matchesStatus = statusFilter === "all" || statusFilter === status
    return matchesSearch && matchesStatus
  })

  const filteredCreditors = data.creditors.filter((creditor) => {
    const matchesSearch = creditor.name.toLowerCase().includes(searchQuery.toLowerCase())
    const status = getDebtStatus(new Date(creditor.dueDate))
    const matchesStatus = statusFilter === "all" || statusFilter === status
    return matchesSearch && matchesStatus
  })

  const totalDebtors = data.debtors.reduce((sum, debtor) => sum + debtor.amount, 0)
  const totalCreditors = data.creditors.reduce((sum, creditor) => sum + creditor.amount, 0)

  const overdueDebtors = data.debtors.filter((debtor) => getDebtStatus(new Date(debtor.dueDate)) === "overdue")

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Debtors & Creditors</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add {activeTab === "debtors" ? "Debtor" : "Creditor"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New {activeTab === "debtors" ? "Debtor" : "Creditor"}</DialogTitle>
              <DialogDescription>
                {activeTab === "debtors"
                  ? "Record a customer who owes you money"
                  : "Record money you owe to a supplier or lender"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={newDebt.type}
                  onValueChange={(value: "debtor" | "creditor") => setNewDebt({ ...newDebt, type: value })}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="debtor">Debtor (owes you)</SelectItem>
                    <SelectItem value="creditor">Creditor (you owe them)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder={newDebt.type === "debtor" ? "e.g., Kampala Traders" : "e.g., Mbale Suppliers"}
                  value={newDebt.name}
                  onChange={(e) => setNewDebt({ ...newDebt, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="amount">Amount (UGX)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="e.g., 150000"
                  value={newDebt.amount}
                  onChange={(e) => setNewDebt({ ...newDebt, amount: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="e.g., Sale of 200kg maize"
                  value={newDebt.description}
                  onChange={(e) => setNewDebt({ ...newDebt, description: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Transaction Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newDebt.date ? format(newDebt.date, "PPP") : "Select a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newDebt.date}
                      onSelect={(date) => date && setNewDebt({ ...newDebt, date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newDebt.dueDate ? format(newDebt.dueDate, "PPP") : "Select a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newDebt.dueDate}
                      onSelect={(date) => date && setNewDebt({ ...newDebt, dueDate: date })}
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
              <Button onClick={handleAddDebt}>Add {newDebt.type === "debtor" ? "Debtor" : "Creditor"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {overdueDebtors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Overdue Payments</AlertTitle>
          <AlertDescription>
            You have {overdueDebtors.length} overdue payment{overdueDebtors.length > 1 ? "s" : ""} totaling UGX{" "}
            {overdueDebtors.reduce((sum, debtor) => sum + debtor.amount, 0).toLocaleString()}.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Total Receivables</CardTitle>
            <CardDescription>Money owed to you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">UGX {totalDebtors.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">
              From {data.debtors.length} customer{data.debtors.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Payables</CardTitle>
            <CardDescription>Money you owe to others</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">UGX {totalCreditors.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">
              To {data.creditors.length} supplier{data.creditors.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Debtors & Creditors</CardTitle>
          <CardDescription>Manage your receivables and payables</CardDescription>
          <div className="flex flex-col gap-4 pt-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="due-soon">Due Soon</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="debtors" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="debtors">Debtors</TabsTrigger>
              <TabsTrigger value="creditors">Creditors</TabsTrigger>
            </TabsList>
            <TabsContent value="debtors" className="mt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDebtors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                        No debtors found. Add your first debtor to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDebtors.map((debtor) => {
                      const status = getDebtStatus(new Date(debtor.dueDate))
                      return (
                        <TableRow key={debtor.id}>
                          <TableCell className="font-medium">{debtor.name}</TableCell>
                          <TableCell>{debtor.description}</TableCell>
                          <TableCell>{format(new Date(debtor.dueDate), "MMM dd, yyyy")}</TableCell>
                          <TableCell>
                            <div
                              className={cn(
                                "flex items-center justify-center w-24 rounded-full px-2.5 py-0.5 text-xs font-medium",
                                status === "overdue"
                                  ? "bg-red-100 text-red-700"
                                  : status === "due-soon"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-green-100 text-green-700",
                              )}
                            >
                              {status === "overdue" ? "Overdue" : status === "due-soon" ? "Due Soon" : "Upcoming"}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">UGX {debtor.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleMarkAsPaid(debtor.id, "debtor")}>
                                <Check className="mr-1 h-3 w-3" />
                                Paid
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteDebt(debtor.id, "debtor")}>
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </TabsContent>
            <TabsContent value="creditors" className="mt-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCreditors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                        No creditors found. Add your first creditor to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCreditors.map((creditor) => {
                      const status = getDebtStatus(new Date(creditor.dueDate))
                      return (
                        <TableRow key={creditor.id}>
                          <TableCell className="font-medium">{creditor.name}</TableCell>
                          <TableCell>{creditor.description}</TableCell>
                          <TableCell>{format(new Date(creditor.dueDate), "MMM dd, yyyy")}</TableCell>
                          <TableCell>
                            <div
                              className={cn(
                                "flex items-center justify-center w-24 rounded-full px-2.5 py-0.5 text-xs font-medium",
                                status === "overdue"
                                  ? "bg-red-100 text-red-700"
                                  : status === "due-soon"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-green-100 text-green-700",
                              )}
                            >
                              {status === "overdue" ? "Overdue" : status === "due-soon" ? "Due Soon" : "Upcoming"}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">UGX {creditor.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkAsPaid(creditor.id, "creditor")}
                              >
                                <Check className="mr-1 h-3 w-3" />
                                Paid
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteDebt(creditor.id, "creditor")}
                              >
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            {activeTab === "debtors"
              ? `Showing ${filteredDebtors.length} of ${data.debtors.length} debtors`
              : `Showing ${filteredCreditors.length} of ${data.creditors.length} creditors`}
          </div>
          <div className="font-medium">
            Total: UGX{" "}
            {(activeTab === "debtors"
              ? filteredDebtors.reduce((sum, debtor) => sum + debtor.amount, 0)
              : filteredCreditors.reduce((sum, creditor) => sum + creditor.amount, 0)
            ).toLocaleString()}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

