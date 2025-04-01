"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import type { User } from "@/lib/auth-types"
import { ArrowLeft, Edit, Trash2, UserPlus } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    profileImage: "",
  })

  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Load users from localStorage
    const storedUsers = localStorage.getItem("grainTrackerUsers")
    const parsedUsers = storedUsers ? JSON.parse(storedUsers) : []

    // Add the current admin if not in the list
    if (user && user.role === "admin" && !parsedUsers.find((u: User) => u.id === user.id)) {
      parsedUsers.push(user)
      localStorage.setItem("grainTrackerUsers", JSON.stringify(parsedUsers))
    }

    setUsers(parsedUsers)
  }, [user])

  useEffect(() => {
    // Apply search filter
    if (searchQuery) {
      setFilteredUsers(
        users.filter(
          (user) =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      )
    } else {
      setFilteredUsers(users)
    }
  }, [users, searchQuery])

  const handleAddUser = () => {
    // Validate inputs
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error("Please fill in all required fields")
      return
    }

    // Check if email already exists
    if (users.some((user) => user.email === newUser.email)) {
      toast.error("A user with this email already exists")
      return
    }

    // Create new user
    const createdUser: User = {
      id: `user-${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role as "admin" | "user",
      profileImage: newUser.profileImage || "/default-avatar.png",
      createdAt: new Date(),
    }

    // Add to users list
    const updatedUsers = [...users, createdUser]
    setUsers(updatedUsers)
    localStorage.setItem("grainTrackerUsers", JSON.stringify(updatedUsers))

    // Reset form and close dialog
    setNewUser({
      name: "",
      email: "",
      password: "",
      role: "user",
      profileImage: "",
    })
    setIsAddUserDialogOpen(false)

    toast.success("User added successfully")
  }

  const handleEditUser = () => {
    if (!selectedUser) return

    // Validate inputs
    if (!selectedUser.name || !selectedUser.email) {
      toast.error("Please fill in all required fields")
      return
    }

    // Update user
    const updatedUsers = users.map((user) => (user.id === selectedUser.id ? selectedUser : user))

    setUsers(updatedUsers)
    localStorage.setItem("grainTrackerUsers", JSON.stringify(updatedUsers))

    // Close dialog
    setIsEditUserDialogOpen(false)
    setSelectedUser(null)

    toast.success("User updated successfully")
  }

  const handleDeleteUser = (userId: string) => {
    // Don't allow deleting yourself
    if (user && userId === user.id) {
      toast.error("You cannot delete your own account")
      return
    }

    // Remove user
    const updatedUsers = users.filter((user) => user.id !== userId)
    setUsers(updatedUsers)
    localStorage.setItem("grainTrackerUsers", JSON.stringify(updatedUsers))

    toast.success("User deleted successfully")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link href="/dashboard" className="flex items-center text-amber-600 hover:text-amber-700">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and permissions</CardDescription>
            </div>

            <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>Create a new user account with specific permissions</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      placeholder="john@example.com"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="user">Normal User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="profileImage">Profile Image URL (Optional)</Label>
                    <Input
                      id="profileImage"
                      value={newUser.profileImage}
                      onChange={(e) => setNewUser({ ...newUser, profileImage: e.target.value })}
                      placeholder="https://example.com/avatar.jpg"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddUser}>Add User</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mt-4">
            <Input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((userItem) => (
                  <TableRow key={userItem.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={userItem.profileImage} alt={userItem.name} />
                          <AvatarFallback className="bg-amber-500 text-white">
                            {getInitials(userItem.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>{userItem.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{userItem.email}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          userItem.role === "admin" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {userItem.role === "admin" ? "Administrator" : "Normal User"}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(userItem.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(userItem)
                            setIsEditUserDialogOpen(true)
                          }}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteUser(userItem.id)}
                          disabled={user?.id === userItem.id}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user information and permissions</DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={selectedUser.name}
                  onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={selectedUser.email}
                  onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                  disabled={user?.id === selectedUser.id}
                />
                {user?.id === selectedUser.id && (
                  <p className="text-xs text-muted-foreground">You cannot change your own email</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select
                  value={selectedUser.role}
                  onValueChange={(value: "admin" | "user") => setSelectedUser({ ...selectedUser, role: value })}
                  disabled={user?.id === selectedUser.id}
                >
                  <SelectTrigger id="edit-role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="user">Normal User</SelectItem>
                  </SelectContent>
                </Select>
                {user?.id === selectedUser.id && (
                  <p className="text-xs text-muted-foreground">You cannot change your own role</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-profileImage">Profile Image URL</Label>
                <Input
                  id="edit-profileImage"
                  value={selectedUser.profileImage || ""}
                  onChange={(e) => setSelectedUser({ ...selectedUser, profileImage: e.target.value })}
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

