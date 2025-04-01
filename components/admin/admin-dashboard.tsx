"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useAppData } from "@/lib/data-store"
import {
  BarChart3,
  CreditCard,
  DollarSign,
  Home,
  LineChart,
  Package,
  ShoppingCart,
  TrendingUp,
  Truck,
  Users,
  Wheat,
  History,
  Trash2,
  User,
  LogOut,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import ExpenseTracker from "@/components/expense-tracker"
import SalesTracker from "@/components/sales-tracker"
import InventoryManagement from "@/components/inventory-management"
import ReportsAnalytics from "@/components/reports-analytics"
import DebtorCreditor from "@/components/debtor-creditor"
import MarketPriceTracker from "@/components/market-price-tracker"
import HistoryTracker from "@/components/history-tracker"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function AdminDashboard() {
  const [mounted, setMounted] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>("dashboard")
  const { data } = useAppData()
  const { user, logout } = useAuth()
  const router = useRouter()
  const [greeting, setGreeting] = useState<string>("Hello")

  useEffect(() => {
    setMounted(true)

    // Set greeting based on time of day
    const hour = new Date().getHours()
    if (hour < 12) {
      setGreeting("Good Morning")
    } else if (hour < 18) {
      setGreeting("Good Afternoon")
    } else {
      setGreeting("Good Evening")
    }
  }, [])

  if (!mounted) return null

  const totalExpenses = data.expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const totalSales = data.sales.reduce((sum, sale) => sum + sale.amount, 0)
  const totalProfit = totalSales - totalExpenses
  const totalInventory = data.inventory.reduce((sum, item) => sum + item.quantity, 0)

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Mobile Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:hidden">
        <Wheat className="h-6 w-6 text-amber-500" />
        <h1 className="font-semibold">Grain Tracker</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="ml-auto">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.profileImage} alt={user?.name} />
                <AvatarFallback className="bg-amber-500 text-white">
                  {user?.name ? getInitials(user.name) : "U"}
                </AvatarFallback>
              </Avatar>
              <span className="sr-only">Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Navigation</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setActiveTab("dashboard")}>Dashboard</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveTab("expenses")}>Expenses</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveTab("sales")}>Sales</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveTab("inventory")}>Inventory</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveTab("debtors")}>Debtors & Creditors</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveTab("market")}>Market Prices</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveTab("reports")}>Reports & Analytics</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveTab("history")}>History</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/users")}>User Management</DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/recycle-bin")}>Recycle Bin</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => logout()}>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <div className="flex flex-1">
        {/* Sidebar Navigation */}
        <aside className="hidden w-64 flex-col border-r bg-muted/40 md:flex">
          <div className="flex h-16 items-center gap-2 border-b px-4">
            <Wheat className="h-6 w-6 text-amber-500" />
            <h1 className="font-semibold">Grain Tracker</h1>
          </div>
          <div className="flex flex-col justify-between h-full">
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
                </div>
              </div>
              <div className="px-3 py-2">
                <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-tight">Admin</h2>
                <div className="space-y-1">
                  <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/users")}>
                    <User className="mr-2 h-4 w-4" />
                    User Management
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" onClick={() => router.push("/recycle-bin")}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Recycle Bin
                  </Button>
                </div>
              </div>
            </nav>

            <div className="p-4 border-t">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarImage src={user?.profileImage} alt={user?.name} />
                        <AvatarFallback className="bg-amber-500 text-white">
                          {user?.name ? getInitials(user.name) : "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start text-sm">
                        <span className="font-medium">{user?.name}</span>
                        <span className="text-xs text-muted-foreground">Admin</span>
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => logout()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-4 md:p-6">
            {activeTab === "dashboard" && (
              <>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold">
                    {greeting}, {user?.name}
                  </h1>
                  <p className="text-muted-foreground">Here's what's happening in your business today</p>
                </div>

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
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle>Recent Transactions</CardTitle>
                      <CardDescription>Your most recent business activities</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {data.history.slice(0, 5).map((entry) => (
                          <div key={entry.id} className="flex items-center">
                            <div
                              className={cn(
                                "mr-4 rounded-full p-2",
                                entry.type === "expense"
                                  ? "bg-red-100"
                                  : entry.type === "sale"
                                    ? "bg-green-100"
                                    : entry.type === "inventory"
                                      ? "bg-blue-100"
                                      : "bg-amber-100",
                              )}
                            >
                              {entry.type === "expense" ? (
                                <CreditCard className="h-4 w-4 text-red-600" />
                              ) : entry.type === "sale" ? (
                                <ShoppingCart className="h-4 w-4 text-green-600" />
                              ) : entry.type === "inventory" ? (
                                <Package className="h-4 w-4 text-blue-600" />
                              ) : (
                                <Truck className="h-4 w-4 text-amber-600" />
                              )}
                            </div>
                            <div className="flex-1 space-y-1">
                              <p className="text-sm font-medium">{entry.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(entry.date).toLocaleDateString()}{" "}
                                {new Date(entry.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                            <div
                              className={cn(
                                "text-sm font-medium",
                                entry.type === "expense" ? "text-red-500" : "text-green-500",
                              )}
                            >
                              {entry.type === "expense" ? "-" : "+"} UGX {entry.amount.toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}

            {activeTab === "expenses" && <ExpenseTracker />}
            {activeTab === "sales" && <SalesTracker />}
            {activeTab === "inventory" && <InventoryManagement />}
            {activeTab === "debtors" && <DebtorCreditor />}
            {activeTab === "market" && <MarketPriceTracker />}
            {activeTab === "reports" && <ReportsAnalytics />}
            {activeTab === "history" && <HistoryTracker />}
          </div>
        </main>
      </div>
    </div>
  )
}

