"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { AppData, HistoryEntry } from "@/lib/types"
// import { addToRecycleBin } from "./recycle-bin"
import { useAuth } from "./auth-context"
import { addToRecycleBin } from "./recycle-bin"

// Initial data structure
const initialData: AppData = {
  expenses: [
    {
      id: "1",
      description: "Fuel for transportation",
      amount: 45000,
      category: "fuel",
      date: new Date(2023, 5, 15),
    },
    {
      id: "2",
      description: "Labor for loading",
      amount: 30000,
      category: "labor",
      date: new Date(2023, 5, 16),
    },
    {
      id: "3",
      description: "Packaging materials",
      amount: 25000,
      category: "packaging",
      date: new Date(2023, 5, 17),
    },
  ],
  sales: [
    {
      id: "1",
      customer: "Kampala Traders",
      amount: 350000,
      quantity: 250,
      isPaid: true,
      date: new Date(2023, 5, 18),
    },
    {
      id: "2",
      customer: "Mbale Market",
      amount: 150000,
      quantity: 100,
      isPaid: false,
      date: new Date(2023, 5, 19),
    },
    {
      id: "3",
      customer: "Jinja Wholesalers",
      amount: 120000,
      quantity: 80,
      isPaid: false,
      date: new Date(2023, 5, 20),
    },
  ],
  inventory: [
    {
      id: "1",
      source: "Mbale Farmers",
      quantity: 500,
      pricePerKg: 1200,
      totalCost: 600000,
      date: new Date(2023, 5, 10),
    },
    {
      id: "2",
      source: "Iganga Cooperative",
      quantity: 300,
      pricePerKg: 1150,
      totalCost: 345000,
      date: new Date(2023, 5, 12),
    },
  ],
  debtors: [
    {
      id: "1",
      name: "Mbale Market",
      amount: 75000,
      description: "Sale of 100kg maize",
      date: new Date(2023, 5, 19),
      dueDate: new Date(2023, 6, 3),
    },
    {
      id: "2",
      name: "Jinja Wholesalers",
      amount: 120000,
      description: "Sale of 80kg maize",
      date: new Date(2023, 5, 20),
      dueDate: new Date(2023, 6, 4),
    },
  ],
  creditors: [
    {
      id: "1",
      name: "Fuel Supplier",
      amount: 50000,
      description: "Fuel credit for transportation",
      date: new Date(2023, 5, 14),
      dueDate: new Date(2023, 5, 28),
    },
  ],
  marketPrices: [
    {
      id: "1",
      market: "Kampala Central Market",
      price: 1500,
      date: new Date(2023, 5, 15),
      notes: "Regular quality maize",
    },
    {
      id: "2",
      market: "Mbale Market",
      price: 1400,
      date: new Date(2023, 5, 16),
      notes: "Prices dropping due to harvest season",
    },
    {
      id: "3",
      market: "Jinja Market",
      price: 1450,
      date: new Date(2023, 5, 17),
      notes: "",
    },
  ],
  history: [
    {
      id: "1",
      type: "expense",
      description: "Fuel for transportation",
      amount: 45000,
      date: new Date(2023, 5, 15),
      details: { category: "fuel" },
    },
    {
      id: "2",
      type: "expense",
      description: "Labor for loading",
      amount: 30000,
      date: new Date(2023, 5, 16),
      details: { category: "labor" },
    },
    {
      id: "3",
      type: "sale",
      description: "Sale to Kampala Traders",
      amount: 350000,
      date: new Date(2023, 5, 18),
      details: { customer: "Kampala Traders", quantity: 250, isPaid: true },
    },
    {
      id: "4",
      type: "inventory",
      description: "Purchase from Mbale Farmers",
      amount: 600000,
      date: new Date(2023, 5, 10),
      details: { source: "Mbale Farmers", quantity: 500, pricePerKg: 1200 },
    },
  ],
  users: [],
  deletedItems: [],
}

interface DataContextType {
  data: AppData
  updateData: (newData: AppData) => void
  addHistoryEntry: (entry: Omit<HistoryEntry, "id">) => void
  getHistoryForDate: (date: Date) => HistoryEntry[]
  deleteItem: (itemType: "expense" | "sale" | "inventory" | "debt" | "marketPrice", id: string) => void
}

// Create context
const DataContext = createContext<DataContextType | null>(null)

// Custom hook to use the data
export function useAppData(): DataContextType {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error("useAppData must be used within a DataProvider")
  }
  return context
}

// Initialize data in localStorage
export function initializeData(): void {
  if (typeof window !== "undefined") {
    const storedData = localStorage.getItem("grainTrackerData")
    if (!storedData) {
      localStorage.setItem("grainTrackerData", JSON.stringify(initialData))
    }
  }
}

interface DataProviderProps {
  children: ReactNode
}

// Provider component
export function DataProvider({ children }: DataProviderProps) {
  const [data, setData] = useState<AppData>(initialData)
  const { user } = useAuth()

  useEffect(() => {
    // Load data from localStorage on mount
    if (typeof window !== "undefined") {
      const storedData = localStorage.getItem("grainTrackerData")
      if (storedData) {
        try {
          const parsedData = JSON.parse(storedData)

          // Convert date strings back to Date objects
          const processedData: AppData = {
            ...parsedData,
            expenses: parsedData.expenses.map((expense: any) => ({
              ...expense,
              date: new Date(expense.date),
            })),
            sales: parsedData.sales.map((sale: any) => ({
              ...sale,
              date: new Date(sale.date),
            })),
            inventory: parsedData.inventory.map((item: any) => ({
              ...item,
              date: new Date(item.date),
            })),
            debtors: parsedData.debtors.map((debtor: any) => ({
              ...debtor,
              date: new Date(debtor.date),
              dueDate: new Date(debtor.dueDate),
            })),
            creditors: parsedData.creditors.map((creditor: any) => ({
              ...creditor,
              date: new Date(creditor.date),
              dueDate: new Date(creditor.dueDate),
            })),
            marketPrices: parsedData.marketPrices.map((price: any) => ({
              ...price,
              date: new Date(price.date),
            })),
            history: parsedData.history
              ? parsedData.history.map((entry: any) => ({
                  ...entry,
                  date: new Date(entry.date),
                }))
              : [],
            users: parsedData.users || [],
            deletedItems: parsedData.deletedItems || [],
          }

          setData(processedData)
        } catch (error) {
          console.error("Error parsing stored data:", error)
          // If there's an error, use the initial data
          setData(initialData)
        }
      }
    }
  }, [])

  // Update data and save to localStorage
  const updateData = (newData: AppData): void => {
    setData(newData)
    if (typeof window !== "undefined") {
      localStorage.setItem("grainTrackerData", JSON.stringify(newData))
    }
  }

  // Add a new history entry
  const addHistoryEntry = (entry: Omit<HistoryEntry, "id">): void => {
    const newEntry: HistoryEntry = {
      ...entry,
      id: Date.now().toString(),
    }

    const updatedData = {
      ...data,
      history: [...data.history, newEntry],
    }

    updateData(updatedData)
  }

  // Get history entries for a specific date
  const getHistoryForDate = (date: Date): HistoryEntry[] => {
    return data.history.filter((entry) => {
      const entryDate = new Date(entry.date)
      return (
        entryDate.getDate() === date.getDate() &&
        entryDate.getMonth() === date.getMonth() &&
        entryDate.getFullYear() === date.getFullYear()
      )
    })
  }

  // Delete an item and add it to the recycle bin
  const deleteItem = (itemType: "expense" | "sale" | "inventory" | "debt" | "marketPrice", id: string): void => {
    let itemToDelete: any = null
    const updatedData = { ...data }

    // Find the item to delete based on type
    switch (itemType) {
      case "expense":
        itemToDelete = data.expenses.find((item) => item.id === id)
        updatedData.expenses = data.expenses.filter((item) => item.id !== id)
        break
      case "sale":
        itemToDelete = data.sales.find((item) => item.id === id)
        updatedData.sales = data.sales.filter((item) => item.id !== id)
        break
      case "inventory":
        itemToDelete = data.inventory.find((item) => item.id === id)
        updatedData.inventory = data.inventory.filter((item) => item.id !== id)
        break
      case "debt":
        // Check both debtors and creditors
        itemToDelete = data.debtors.find((item) => item.id === id)
        if (itemToDelete) {
          updatedData.debtors = data.debtors.filter((item) => item.id !== id)
        } else {
          itemToDelete = data.creditors.find((item) => item.id === id)
          updatedData.creditors = data.creditors.filter((item) => item.id !== id)
        }
        break
      case "marketPrice":
        itemToDelete = data.marketPrices.find((item) => item.id === id)
        updatedData.marketPrices = data.marketPrices.filter((item) => item.id !== id)
        break
    }

    if (itemToDelete) {
      // Add to recycle bin
      addToRecycleBin(itemType, itemToDelete, user?.id || "unknown")

      // Update data
      updateData(updatedData)
    }
  }

  return (
    <DataContext.Provider value={{ data, updateData, addHistoryEntry, getHistoryForDate, deleteItem }}>
      {children}
    </DataContext.Provider>
  )
}

// Wrap the app with the provider
export function withDataProvider<T extends object>(Component: React.ComponentType<T>): React.FC<T> {
  return function WithDataProvider(props: T) {
    return (
      <DataProvider>
        <Component {...props} />
      </DataProvider>
    )
  }
}

