import type { DeletedItem } from "./auth-types"

// Function to add an item to the recycle bin
export const addToRecycleBin = (
  itemType: "expense" | "sale" | "inventory" | "debt" | "marketPrice",
  data: any,
  deletedBy: string,
): void => {
  const deletedItem: DeletedItem = {
    id: `deleted-${Date.now()}`,
    itemType,
    data,
    deletedBy,
    deletedAt: new Date(),
  }

  // Get existing deleted items
  const recycleBin = getRecycleBin()

  // Add new item
  recycleBin.push(deletedItem)

  // Save to localStorage
  localStorage.setItem("grainTrackerRecycleBin", JSON.stringify(recycleBin))
}

// Function to get all items in the recycle bin
export const getRecycleBin = (): DeletedItem[] => {
  const recycleBin = localStorage.getItem("grainTrackerRecycleBin")
  return recycleBin ? JSON.parse(recycleBin) : []
}

// Function to restore an item from the recycle bin
export const restoreFromRecycleBin = (id: string, restoredBy: string): any | null => {
  const recycleBin = getRecycleBin()
  const itemIndex = recycleBin.findIndex((item) => item.id === id)

  if (itemIndex === -1) return null

  const item = recycleBin[itemIndex]

  // Mark as restored
  item.restoredAt = new Date()
  item.restoredBy = restoredBy

  // Update recycle bin
  localStorage.setItem("grainTrackerRecycleBin", JSON.stringify(recycleBin))

  return item.data
}

// Function to permanently delete an item from the recycle bin
export const permanentlyDeleteFromRecycleBin = (id: string): boolean => {
  const recycleBin = getRecycleBin()
  const updatedRecycleBin = recycleBin.filter((item) => item.id !== id)

  if (updatedRecycleBin.length === recycleBin.length) {
    return false // Item not found
  }

  localStorage.setItem("grainTrackerRecycleBin", JSON.stringify(updatedRecycleBin))
  return true
}

// Function to get deleted items by type
export const getDeletedItemsByType = (
  itemType: "expense" | "sale" | "inventory" | "debt" | "marketPrice",
): DeletedItem[] => {
  const recycleBin = getRecycleBin()
  return recycleBin.filter((item) => item.itemType === itemType)
}

