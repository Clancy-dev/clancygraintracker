"use client"

import { useState } from "react"
import { CalendarIcon, Plus, Search, Trash2, TrendingDown, TrendingUp } from "lucide-react"
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
import { useAppData } from "@/lib/data-store"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { NewMarketPrice } from "@/lib/types"
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

export default function MarketPriceTracker() {
  const [open, setOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [marketFilter, setMarketFilter] = useState<string>("all")
  const { data, updateData, addHistoryEntry } = useAppData()

  const [newPrice, setNewPrice] = useState<NewMarketPrice>({
    market: "",
    price: "",
    date: new Date(),
    notes: "",
  })

  const handleAddPrice = () => {
    if (!newPrice.market || !newPrice.price) {
      toast.error("Missing information", {
        description: "Please fill in all required fields",
      })
      return
    }

    const price = {
      id: Date.now().toString(),
      market: newPrice.market,
      price: Number.parseFloat(newPrice.price),
      date: newPrice.date,
      notes: newPrice.notes,
    }

    updateData({
      ...data,
      marketPrices: [...data.marketPrices, price],
    })

    // Add to history
    addHistoryEntry({
      type: "marketPrice",
      description: `Recorded price at ${newPrice.market}`,
      amount: Number.parseFloat(newPrice.price),
      date: newPrice.date,
      details: { market: newPrice.market, notes: newPrice.notes },
    })

    toast.success("Price recorded", {
      description: "Market price has been recorded successfully",
    })

    setNewPrice({
      market: "",
      price: "",
      date: new Date(),
      notes: "",
    })

    setOpen(false)
  }

  const handleDeletePrice = (id: string) => {
    const priceToDelete = data.marketPrices.find((p) => p.id === id)

    updateData({
      ...data,
      marketPrices: data.marketPrices.filter((price) => price.id !== id),
    })

    if (priceToDelete) {
      addHistoryEntry({
        type: "marketPrice",
        description: `Removed price record for ${priceToDelete.market}`,
        amount: priceToDelete.price,
        date: new Date(),
        details: { action: "deleted" },
      })
    }

    toast.success("Price deleted", {
      description: "The market price has been removed",
    })
  }

  const filteredPrices = data.marketPrices.filter((price) => {
    const matchesSearch =
      price.market.toLowerCase().includes(searchQuery.toLowerCase()) ||
      price.notes.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesMarket = marketFilter === "all" || price.market === marketFilter
    return matchesSearch && matchesMarket
  })

  // Get unique markets for filter
  const markets = [...new Set(data.marketPrices.map((price) => price.market))]

  // Calculate average price
  const averagePrice =
    data.marketPrices.length > 0
      ? data.marketPrices.reduce((sum, price) => sum + price.price, 0) / data.marketPrices.length
      : 0

  // Get latest price
  const latestPrice =
    data.marketPrices.length > 0
      ? [...data.marketPrices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].price
      : 0

  // Calculate price change
  const previousPrice =
    data.marketPrices.length > 1
      ? [...data.marketPrices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[1].price
      : latestPrice

  const priceChange = latestPrice - previousPrice
  const priceChangePercentage = previousPrice > 0 ? (priceChange / previousPrice) * 100 : 0

  // Prepare chart data
  const chartData = [...data.marketPrices]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((price) => ({
      date: format(new Date(price.date), "MMM dd"),
      price: price.price,
      market: price.market,
    }))

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Market Price Tracker</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Price
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Market Price</DialogTitle>
              <DialogDescription>Track maize prices in different markets</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="market">Market</Label>
                <Input
                  id="market"
                  placeholder="e.g., Kampala Central Market"
                  value={newPrice.market}
                  onChange={(e) => setNewPrice({ ...newPrice, market: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Price per kg (UGX)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="e.g., 1500"
                  value={newPrice.price}
                  onChange={(e) => setNewPrice({ ...newPrice, price: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newPrice.date ? format(newPrice.date, "PPP") : "Select a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={newPrice.date}
                      onSelect={(date) => date && setNewPrice({ ...newPrice, date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Input
                  id="notes"
                  placeholder="e.g., Price after recent rainfall"
                  value={newPrice.notes}
                  onChange={(e) => setNewPrice({ ...newPrice, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddPrice}>Record Price</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Current Price</CardTitle>
            <CardDescription>Latest recorded price</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">UGX {latestPrice.toLocaleString()}</div>
            <div className="flex items-center mt-2">
              {priceChange !== 0 && (
                <>
                  {priceChange > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={cn("text-sm", priceChange > 0 ? "text-green-500" : "text-red-500")}>
                    {priceChange > 0 ? "+" : ""}
                    {priceChange.toLocaleString()}({priceChangePercentage.toFixed(1)}%)
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Average Price</CardTitle>
            <CardDescription>Across all markets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              UGX {averagePrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <p className="text-sm text-muted-foreground">Based on {data.marketPrices.length} price records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Price Range</CardTitle>
            <CardDescription>Min and max prices</CardDescription>
          </CardHeader>
          <CardContent>
            {data.marketPrices.length > 0 ? (
              <>
                <div className="flex justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Min</div>
                    <div className="text-xl font-bold">
                      UGX {Math.min(...data.marketPrices.map((p) => p.price)).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Max</div>
                    <div className="text-xl font-bold">
                      UGX {Math.max(...data.marketPrices.map((p) => p.price)).toLocaleString()}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-muted-foreground">No price data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Price History</CardTitle>
          <CardDescription>Track and analyze market prices</CardDescription>
          <div className="flex flex-col gap-4 pt-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search markets or notes..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={marketFilter} onValueChange={setMarketFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by market" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Markets</SelectItem>
                {markets.map((market) => (
                  <SelectItem key={market} value={market}>
                    {market}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-60 w-full mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart
                data={chartData}
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
                <Tooltip formatter={(value) => [`UGX ${value}`, "Price"]} />
                <Line type="monotone" dataKey="price" stroke="#f59e0b" activeDot={{ r: 8 }} />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Market</TableHead>
                <TableHead className="text-right">Price (UGX/kg)</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                    No price records found. Add your first market price to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPrices.map((price) => (
                  <TableRow key={price.id}>
                    <TableCell>{format(new Date(price.date), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{price.market}</TableCell>
                    <TableCell className="text-right">{price.price.toLocaleString()}</TableCell>
                    <TableCell>{price.notes}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDeletePrice(price.id)}>
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
            Showing {filteredPrices.length} of {data.marketPrices.length} price records
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

