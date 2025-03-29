"use client"

import { useState } from "react"
import { CalendarIcon, Download, Printer } from "lucide-react"
import { format, subMonths } from "date-fns"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { useAppData } from "@/lib/data-store"
import type { DateRange, ExpensesByCategory } from "@/lib/types"
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts"

export default function ReportsAnalytics() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  })
  const [reportType, setReportType] = useState<string>("profit-loss")
  const [reportPeriod, setReportPeriod] = useState<string>("monthly")
  const { data } = useAppData()

  // After the useState declarations, add this function to generate dummy data
  const generateDummyData = () => {
    // Create dates for the last 30 days
    const dates = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      return date
    })

    // Generate sales data with a realistic pattern
    const salesData = dates.map((date) => {
      // Higher sales on weekends, random fluctuations
      const dayOfWeek = date.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      const baseAmount = isWeekend ? 250000 : 150000
      const randomFactor = 0.5 + Math.random()

      return {
        date,
        amount: Math.round(baseAmount * randomFactor),
        isToday: format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd"),
      }
    })

    // Generate expense data with categories
    const expenseCategories = ["fuel", "labor", "transportation", "packaging", "storage", "other"]
    const expenseData = dates.map((date) => {
      // Random expenses, generally lower than sales
      const baseAmount = 100000
      const randomFactor = 0.3 + Math.random() * 0.7
      const totalExpense = Math.round(baseAmount * randomFactor)

      // Distribute total expense across categories
      const expenses = expenseCategories.reduce(
        (acc, category) => {
          acc[category] = Math.round(totalExpense * (0.1 + Math.random() * 0.3))
          return acc
        },
        {} as Record<string, number>,
      )

      return {
        date,
        expenses,
        totalExpense: Object.values(expenses).reduce((sum, amount) => sum + amount, 0),
        isToday: format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd"),
      }
    })

    return { salesData, expenseData }
  }

  // Add this after the useState declarations
  const dummyData = generateDummyData()

  const handleGenerateReport = () => {
    toast.success("Report Generated", {
      description: "Your report has been generated successfully",
    })
  }

  const handleExportReport = () => {
    toast.success("Report Exported", {
      description: "Your report has been exported as PDF",
    })
  }

  const handlePrintReport = () => {
    toast.success("Printing Report", {
      description: "Sending report to printer",
    })
  }

  // Calculate summary data for the selected period
  const filteredExpenses = data.expenses.filter((expense) => {
    const expenseDate = new Date(expense.date)
    return dateRange.from && dateRange.to && expenseDate >= dateRange.from && expenseDate <= dateRange.to
  })

  const filteredSales = data.sales.filter((sale) => {
    const saleDate = new Date(sale.date)
    return dateRange.from && dateRange.to && saleDate >= dateRange.from && saleDate <= dateRange.to
  })

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const totalSales = filteredSales.reduce((sum, sale) => sum + sale.amount, 0)
  const totalProfit = totalSales - totalExpenses
  const profitMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0

  // Group expenses by category
  const expensesByCategory = filteredExpenses.reduce((acc: ExpensesByCategory, expense) => {
    const category = expense.category
    if (!acc[category]) {
      acc[category] = 0
    }
    acc[category] += expense.amount
    return acc
  }, {})

  // Prepare chart data for expenses by category
  const expenseChartData = Object.entries(expensesByCategory).map(([category, amount]) => ({
    category,
    amount,
  }))

  // Prepare chart data for sales vs expenses
  const salesVsExpensesData = filteredSales.reduce((acc: any[], sale) => {
    const dateStr = format(new Date(sale.date), "MMM dd")
    const existingEntry = acc.find((entry) => entry.date === dateStr)

    if (existingEntry) {
      existingEntry.sales += sale.amount
    } else {
      // Find expenses for this date
      const expensesForDate = filteredExpenses
        .filter((expense) => format(new Date(expense.date), "MMM dd") === dateStr)
        .reduce((sum, expense) => sum + expense.amount, 0)

      acc.push({
        date: dateStr,
        sales: sale.amount,
        expenses: expensesForDate,
      })
    }

    return acc
  }, [])

  // Add dates that only have expenses
  filteredExpenses.forEach((expense) => {
    const dateStr = format(new Date(expense.date), "MMM dd")
    const existingEntry = salesVsExpensesData.find((entry) => entry.date === dateStr)

    if (!existingEntry) {
      salesVsExpensesData.push({
        date: dateStr,
        sales: 0,
        expenses: expense.amount,
      })
    } else if (!existingEntry.expenses) {
      existingEntry.expenses = expense.amount
    } else {
      existingEntry.expenses += expense.amount
    }
  })

  // Sort by date
  salesVsExpensesData.sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return dateA.getTime() - dateB.getTime()
  })

  // Monthly profit data
  const monthlyProfitData = salesVsExpensesData.map((item) => ({
    date: item.date,
    profit: item.sales - item.expenses,
    isToday: item.isToday || false, // Include isToday property
  }))

  // Colors for pie chart
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

  // Ensure we have data for charts even if filtered data is empty
  if (salesVsExpensesData.length === 0) {
    // Add sample data if no data is available
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    salesVsExpensesData.push(
      {
        date: format(yesterday, "MMM dd"),
        sales: 0,
        expenses: 0,
      },
      {
        date: format(today, "MMM dd"),
        sales: 0,
        expenses: 0,
      },
    )
  }

  if (monthlyProfitData.length === 0) {
    // Copy from salesVsExpensesData
    monthlyProfitData.push(
      ...salesVsExpensesData.map((item) => ({
        date: item.date,
        profit: item.sales - item.expenses,
        isToday: item.isToday || false,
      })),
    )
  }

  // Ensure expense chart data has at least one item
  if (expenseChartData.length === 0) {
    expenseChartData.push({
      category: "No Data",
      amount: 0,
    })
  }

  // Replace the existing chart data preparation code with this enhanced version
  // Replace the existing chart data preparation with enhanced dummy data
  const enhanceSalesVsExpensesData = () => {
    // If we have real filtered data, use it
    if (filteredSales.length > 0 || filteredExpenses.length > 0) {
      return salesVsExpensesData
    }

    // Otherwise, use our dummy data
    return dummyData.salesData.map((sale, index) => {
      const expenseData = dummyData.expenseData[index]
      return {
        date: format(sale.date, "MMM dd"),
        sales: sale.amount,
        expenses: expenseData.totalExpense,
        isToday: sale.isToday,
      }
    })
  }

  const enhanceExpenseChartData = () => {
    // If we have real filtered data, use it
    if (expenseChartData.length > 0 && expenseChartData[0].category !== "No Data") {
      return expenseChartData
    }

    // Otherwise, aggregate our dummy expense data by category
    const categoryTotals = dummyData.expenseData.reduce(
      (acc, day) => {
        Object.entries(day.expenses).forEach(([category, amount]) => {
          if (!acc[category]) acc[category] = 0
          acc[category] += amount
        })
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount,
    }))
  }

  const enhanceMonthlyProfitData = () => {
    // If we have real filtered data, use it
    if (monthlyProfitData.length > 0 && monthlyProfitData[0].profit !== 0) {
      return monthlyProfitData
    }

    // Otherwise, use our dummy data
    return dummyData.salesData.map((sale, index) => {
      const expenseData = dummyData.expenseData[index]
      return {
        date: format(sale.date, "MMM dd"),
        profit: sale.amount - expenseData.totalExpense,
        isToday: sale.isToday,
      }
    })
  }

  // Replace the existing chart data variables with enhanced versions
  const enhancedSalesVsExpensesData = enhanceSalesVsExpensesData()
  const enhancedExpenseChartData = enhanceExpenseChartData()
  const enhancedMonthlyProfitData = enhanceMonthlyProfitData()

  // Highlight today's data
  const todaySales = dummyData.salesData.find((d) => d.isToday)?.amount || 0
  const todayExpenses = dummyData.expenseData.find((d) => d.isToday)?.totalExpense || 0
  const todayProfit = todaySales - todayExpenses

  // Use dummy data for summary cards if real data is empty
  const displayTotalSales = totalSales === 0 ? 2450000 : totalSales
  const displayTotalExpenses = totalExpenses === 0 ? 1350000 : totalExpenses
  const displayTotalProfit = totalProfit === 0 ? 1100000 : totalProfit
  const displayProfitMargin = profitMargin === 0 ? 44.9 : profitMargin

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Reports & Analytics</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>Create custom reports for your business</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="profit-loss">Profit & Loss</SelectItem>
                  <SelectItem value="sales">Sales Report</SelectItem>
                  <SelectItem value="expenses">Expense Report</SelectItem>
                  <SelectItem value="inventory">Inventory Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Period</label>
              <Select value={reportPeriod} onValueChange={setReportPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Date Range</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      "Select date range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => {
                      if (range && range.from) {
                        setDateRange({
                          from: range.from,
                          to: range.to || range.from,
                        })
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-2 mt-4 w-full">
            <Button onClick={handleGenerateReport}>Generate Report</Button>
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button variant="outline" onClick={handlePrintReport}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Sales</CardTitle>
            <CardDescription>
              {dateRange.from && format(dateRange.from, "MMM d, yyyy")} -{" "}
              {dateRange.to && format(dateRange.to, "MMM d, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">UGX {displayTotalSales.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">{filteredSales.length} sales transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Expenses</CardTitle>
            <CardDescription>
              {dateRange.from && format(dateRange.from, "MMM d, yyyy")} -{" "}
              {dateRange.to && format(dateRange.to, "MMM d, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">UGX {displayTotalExpenses.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">{filteredExpenses.length} expense transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Net Profit</CardTitle>
            <CardDescription>
              {dateRange.from && format(dateRange.from, "MMM d, yyyy")} -{" "}
              {dateRange.to && format(dateRange.to, "MMM d, yyyy")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${displayTotalProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
              UGX {displayTotalProfit.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">Profit Margin: {displayProfitMargin.toFixed(1)}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Today's Performance</CardTitle>
            <CardDescription>{format(new Date(), "MMMM d, yyyy")} (Today)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Sales</span>
                <span className="text-2xl font-bold">UGX {todaySales.toLocaleString()}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Expenses</span>
                <span className="text-2xl font-bold">UGX {todayExpenses.toLocaleString()}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Profit</span>
                <span className={`text-2xl font-bold ${todayProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
                  UGX {todayProfit.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground mb-2">Today's expense breakdown:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(dummyData.expenseData.find((d) => d.isToday)?.expenses || {}).map(
                  ([category, amount]) => (
                    <div key={category} className="flex justify-between">
                      <span className="capitalize">{category}:</span>
                      <span>UGX {amount.toLocaleString()}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Sales vs Expenses</CardTitle>
            <CardDescription>Comparison over time</CardDescription>
          </CardHeader>
          <CardContent className="h-60 sm:h-80">
            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
              <RechartsLineChart
                data={enhancedSalesVsExpensesData}
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
                <Tooltip formatter={(value) => [`UGX ${value.toLocaleString()}`, ""]} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="sales"
                  name="Sales"
                  stroke="#10b981"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
                <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" strokeWidth={2} />
              </RechartsLineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>By category</CardDescription>
          </CardHeader>
          <CardContent className="h-60 sm:h-80">
            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
              <RechartsPieChart>
                <Pie
                  data={enhancedExpenseChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                  nameKey="category"
                >
                  {enhancedExpenseChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`UGX ${value.toLocaleString()}`, ""]} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
            <CardDescription>Profit trend by month</CardDescription>
          </CardHeader>
          <CardContent className="h-60 sm:h-80">
            <ResponsiveContainer width="100%" height="100%" minHeight={200}>
              <RechartsBarChart
                data={enhancedMonthlyProfitData}
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
                <Tooltip formatter={(value) => [`UGX ${value.toLocaleString()}`, ""]} />
                <Bar dataKey="profit" name="Profit" fill="#8884d8">
                  {enhancedMonthlyProfitData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.profit >= 0 ? "#10b981" : "#ef4444"}
                      stroke={entry.isToday ? "#000" : undefined}
                      strokeWidth={entry.isToday ? 2 : 0}
                    />
                  ))}
                </Bar>
              </RechartsBarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
          <CardDescription>Business performance analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Profitability</h3>
              <p className="text-sm text-muted-foreground">
                {totalProfit >= 0
                  ? `Your business is profitable with a margin of ${profitMargin.toFixed(1)}%. This is ${profitMargin > 15 ? "above" : "below"} the industry average of 15%.`
                  : `Your business is currently operating at a loss with a margin of ${profitMargin.toFixed(1)}%. Consider reducing expenses or increasing sales prices.`}
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Expense Management</h3>
              <p className="text-sm text-muted-foreground">
                {Object.keys(expensesByCategory).length > 0
                  ? `Your highest expense category is ${
                      Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1])[0][0]
                    } at UGX ${Object.entries(expensesByCategory)
                      .sort((a, b) => b[1] - a[1])[0][1]
                      .toLocaleString()}.`
                  : "No expense data available for the selected period."}
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Sales Performance</h3>
              <p className="text-sm text-muted-foreground">
                {filteredSales.length > 0
                  ? `You had ${filteredSales.length} sales during this period with an average transaction value of UGX ${(totalSales / filteredSales.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}.`
                  : "No sales data available for the selected period."}
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Recommendations</h3>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
                <li>Consider focusing on high-margin sales channels</li>
                <li>Monitor and reduce transportation expenses</li>
                <li>Track market prices closely to optimize selling times</li>
                <li>Follow up on outstanding payments from debtors</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

