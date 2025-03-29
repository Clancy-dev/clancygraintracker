export interface Expense {
  id: string
  description: string
  amount: number
  category: string
  date: Date
}

export interface Sale {
  id: string
  customer: string
  amount: number
  quantity: number
  isPaid: boolean
  date: Date
}

export interface InventoryItem {
  id: string
  source: string
  quantity: number
  pricePerKg: number
  totalCost: number
  date: Date
}

export interface Debt {
  id: string
  name: string
  amount: number
  description: string
  date: Date
  dueDate: Date
}

export interface MarketPrice {
  id: string
  market: string
  price: number
  date: Date
  notes: string
}

export interface HistoryEntry {
  id: string
  type: "expense" | "sale" | "inventory" | "debt" | "marketPrice"
  description: string
  amount: number
  date: Date
  details: Record<string, any>
}

export interface AppData {
  expenses: Expense[]
  sales: Sale[]
  inventory: InventoryItem[]
  debtors: Debt[]
  creditors: Debt[]
  marketPrices: MarketPrice[]
  history: HistoryEntry[]
}

export interface DateRange {
  from: Date | undefined
  to: Date | undefined
}

export interface NewExpense {
  description: string
  amount: string
  category: string
  date: Date
}

export interface NewSale {
  customer: string
  amount: string
  quantity: string
  isPaid: boolean
  date: Date
}

export interface NewInventory {
  source: string
  quantity: string
  pricePerKg: string
  date: Date
}

export interface NewDebt {
  name: string
  amount: string
  description: string
  date: Date
  dueDate: Date
  type: "debtor" | "creditor"
}

export interface NewMarketPrice {
  market: string
  price: string
  date: Date
  notes: string
}

export interface ExpensesByCategory {
  [key: string]: number
}

