"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  BarChart3,
  CreditCard,
  DollarSign,
  Home,
  LineChart,
  Package,
  Settings,
  ShoppingCart,
  TrendingUp,
  Truck,
  Users,
  Wheat,
  History,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import ExpenseTracker from "@/components/expense-tracker"
import SalesTracker from "@/components/sales-tracker"
import InventoryManagement from "@/components/inventory-management"
import ReportsAnalytics from "@/components/reports-analytics"
import DebtorCreditor from "@/components/debtor-creditor"
import MarketPriceTracker from "@/components/market-price-tracker"
import HistoryTracker from "@/components/history-tracker"
import { initializeData, useAppData } from "@/lib/data-store"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts"

export default function Dashboard() {
  const [mounted, setMounted] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>("dashboard")
  const { data } = useAppData()

  useEffect(() => {
    setMounted(true)
    initializeData()

    // Show welcome toast
    toast.success("Welcome to Grain Tracker", {
      description: "Your maize business management solution",
    })
  }, [])

  if (!mounted) return null

  const totalExpenses = data.expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const totalSales = data.sales.reduce((sum, sale) => sum + sale.amount, 0)
  const totalProfit = totalSales - totalExpenses
  const totalInventory = data.inventory.reduce((sum, item) => sum + item.quantity, 0)

  // Prepare chart data for sales overview
  const salesData = data.sales.reduce((acc: any[], sale) => {
    const dateStr = format(new Date(sale.date), "MMM dd")
    const existingEntry = acc.find((entry) => entry.date === dateStr)

    if (existingEntry) {
      existingEntry.amount += sale.amount
    } else {
      acc.push({
        date: dateStr,
        amount: sale.amount,
      })
    }

    return acc
  }, [])

  // Sort by date
  salesData.sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return dateA.getTime() - dateB.getTime()
  })

  // Prepare expense breakdown data
  const expensesByCategory = data.expenses.reduce((acc: { [key: string]: number }, expense) => {
    const category = expense.category
    if (!acc[category]) {
      acc[category] = 0
    }
    acc[category] += expense.amount
    return acc
  }, {})

  const expenseChartData = Object.entries(expensesByCategory).map(([category, amount]) => ({
    category,
    amount,
    value: amount, // for pie chart
  }))

  // Colors for pie chart
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

  return (
    <div className="flex min-h-screen flex-col">
      {/* Mobile Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:hidden">
        <Wheat className="h-6 w-6 text-amber-500" />
        <h1 className="font-semibold">Grain Tracker</h1>
        <Button variant="outline" size="icon" className="ml-auto" onClick={() => setActiveTab("menu")}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Menu</span>
        </Button>
      </header>

      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <aside className="hidden w-64 flex-col border-r bg-muted/40 md:flex">
          <div className="flex h-16 items-center gap-2 border-b px-4">
            <Wheat className="h-6 w-6 text-amber-500" />
            <h1 className="font-semibold">Grain Tracker</h1>
          </div>
          <nav className="flex-1 overflow-auto py-4">
            <div className="px-3 py-2">
              <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-tight">Overview</h2>
              <div className="space-y-1">
                <Button
                  variant={activeTab === "dashboard" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("dashboard")}
                >
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
                <Button
                  variant={activeTab === "expenses" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("expenses")}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  Expenses
                </Button>
                <Button
                  variant={activeTab === "sales" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("sales")}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Sales
                </Button>
              </div>
            </div>
            <div className="px-3 py-2">
              <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-tight">Management</h2>
              <div className="space-y-1">
                <Button
                  variant={activeTab === "inventory" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("inventory")}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Inventory
                </Button>
                <Button
                  variant={activeTab === "debtors" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("debtors")}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Debtors & Creditors
                </Button>
                <Button
                  variant={activeTab === "market" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("market")}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Market Prices
                </Button>
              </div>
            </div>
            <div className="px-3 py-2">
              <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-tight">Analysis</h2>
              <div className="space-y-1">
                <Button
                  variant={activeTab === "reports" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("reports")}
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Reports & Analytics
                </Button>
                <Button
                  variant={activeTab === "history" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("history")}
                >
                  <History className="mr-2 h-4 w-4" />
                  History
                </Button>
                <Button
                  variant={activeTab === "settings" ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setActiveTab("settings")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </div>
            </div>
          </nav>
        </aside>

        {/* Mobile Menu */}
        {activeTab === "menu" && (
          <div className="fixed inset-0 z-20 bg-background md:hidden">
            <div className="flex h-16 items-center gap-4 border-b px-4">
              <Wheat className="h-6 w-6 text-amber-500" />
              <h1 className="font-semibold">Menu</h1>
              <Button variant="outline" size="icon" className="ml-auto" onClick={() => setActiveTab("dashboard")}>
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <nav className="grid gap-2 p-4">
              <Button
                variant="ghost"
                className="flex h-10 items-center justify-start px-4"
                onClick={() => setActiveTab("dashboard")}
              >
                <Home className="mr-2 h-5 w-5" />
                Dashboard
              </Button>
              <Button
                variant="ghost"
                className="flex h-10 items-center justify-start px-4"
                onClick={() => setActiveTab("expenses")}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Expenses
              </Button>
              <Button
                variant="ghost"
                className="flex h-10 items-center justify-start px-4"
                onClick={() => setActiveTab("sales")}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Sales
              </Button>
              <Button
                variant="ghost"
                className="flex h-10 items-center justify-start px-4"
                onClick={() => setActiveTab("inventory")}
              >
                <Package className="mr-2 h-5 w-5" />
                Inventory
              </Button>
              <Button
                variant="ghost"
                className="flex h-10 items-center justify-start px-4"
                onClick={() => setActiveTab("debtors")}
              >
                <Users className="mr-2 h-5 w-5" />
                Debtors & Creditors
              </Button>
              <Button
                variant="ghost"
                className="flex h-10 items-center justify-start px-4"
                onClick={() => setActiveTab("market")}
              >
                <TrendingUp className="mr-2 h-5 w-5" />
                Market Prices
              </Button>
              <Button
                variant="ghost"
                className="flex h-10 items-center justify-start px-4"
                onClick={() => setActiveTab("reports")}
              >
                <BarChart3 className="mr-2 h-5 w-5" />
                Reports & Analytics
              </Button>
              <Button
                variant="ghost"
                className="flex h-10 items-center justify-start px-4"
                onClick={() => setActiveTab("history")}
              >
                <History className="mr-2 h-5 w-5" />
                History
              </Button>
              <Button
                variant="ghost"
                className="flex h-10 items-center justify-start px-4"
                onClick={() => setActiveTab("settings")}
              >
                <Settings className="mr-2 h-5 w-5" />
                Settings
              </Button>
            </nav>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 md:p-6">
            {activeTab === "dashboard" && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">UGX {totalSales.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Expenses</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">UGX {totalExpenses.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">+4.3% from last month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                    <LineChart className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className={cn("text-2xl font-bold", totalProfit < 0 ? "text-red-500" : "text-green-500")}>
                      UGX {totalProfit.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">+12.5% from last month</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Inventory</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalInventory.toLocaleString()} kg</div>
                    <p className="text-xs text-muted-foreground">-3.2% from last month</p>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Sales Overview</CardTitle>
                    <CardDescription>Your sales performance for the past 30 days</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={salesData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`UGX ${value.toLocaleString()}`, "Amount"]} />
                        <Bar dataKey="amount" name="Sales" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Expense Breakdown</CardTitle>
                    <CardDescription>Your expense categories for the current month</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={expenseChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="category"
                        >
                          {expenseChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`UGX ${value.toLocaleString()}`, ""]} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>Your most recent business activities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <div className="mr-4 rounded-full bg-amber-100 p-2">
                          <Truck className="h-4 w-4 text-amber-600" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">Transportation Expense</p>
                          <p className="text-xs text-muted-foreground">Today, 10:30 AM</p>
                        </div>
                        <div className="text-sm font-medium text-red-500">-UGX 45,000</div>
                      </div>
                      <div className="flex items-center">
                        <div className="mr-4 rounded-full bg-green-100 p-2">
                          <ShoppingCart className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">Maize Sale to Kampala Traders</p>
                          <p className="text-xs text-muted-foreground">Yesterday, 2:15 PM</p>
                        </div>
                        <div className="text-sm font-medium text-green-500">+UGX 350,000</div>
                      </div>
                      <div className="flex items-center">
                        <div className="mr-4 rounded-full bg-blue-100 p-2">
                          <Package className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">Inventory Purchase</p>
                          <p className="text-xs text-muted-foreground">Yesterday, 9:00 AM</p>
                        </div>
                        <div className="text-sm font-medium text-red-500">-UGX 200,000</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Outstanding Payments</CardTitle>
                    <CardDescription>Customers with pending payments</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <div className="mr-4 rounded-full bg-red-100 p-2">
                          <Users className="h-4 w-4 text-red-600" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">Kampala Traders</p>
                          <p className="text-xs text-muted-foreground">Due in 5 days</p>
                        </div>
                        <div className="text-sm font-medium">UGX 150,000</div>
                      </div>
                      <div className="flex items-center">
                        <div className="mr-4 rounded-full bg-red-100 p-2">
                          <Users className="h-4 w-4 text-red-600" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">Mbale Market</p>
                          <p className="text-xs text-muted-foreground">Due in 2 days</p>
                        </div>
                        <div className="text-sm font-medium">UGX 75,000</div>
                      </div>
                      <div className="flex items-center">
                        <div className="mr-4 rounded-full bg-red-100 p-2">
                          <Users className="h-4 w-4 text-red-600" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium">Jinja Wholesalers</p>
                          <p className="text-xs text-muted-foreground">Overdue by 3 days</p>
                        </div>
                        <div className="text-sm font-medium">UGX 120,000</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "expenses" && <ExpenseTracker />}
            {activeTab === "sales" && <SalesTracker />}
            {activeTab === "inventory" && <InventoryManagement />}
            {activeTab === "debtors" && <DebtorCreditor />}
            {activeTab === "market" && <MarketPriceTracker />}
            {activeTab === "reports" && <ReportsAnalytics />}
            {activeTab === "history" && <HistoryTracker />}
            {activeTab === "settings" && (
              <div className="max-w-md mx-auto">
                <h2 className="text-2xl font-bold mb-6">Settings</h2>
                <p className="text-muted-foreground mb-4">Settings page is under construction.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

// Missing components for mobile
interface IconProps extends React.SVGProps<SVGSVGElement> {}

function Menu(props: IconProps) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  )
}

function X(props: IconProps) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

function format(date: Date, formatStr: string): string {
  const day = date.getDate().toString().padStart(2, "0")
  const month = date.toLocaleString("default", { month: "short" })
  const year = date.getFullYear()

  if (formatStr === "MMM dd") {
    return `${month} ${day}`
  }

  if (formatStr === "MMM dd, yyyy") {
    return `${month} ${day}, ${year}`
  }

  if (formatStr === "LLL dd, y") {
    return `${month} ${day}, ${year}`
  }

  if (formatStr === "PPP") {
    return `${month} ${day}, ${year}`
  }

  return `${month} ${day}, ${year}`
}

