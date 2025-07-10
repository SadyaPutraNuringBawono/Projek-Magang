"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Pencil,
  X,
  ImageIcon,
  Search,
  Trash2,
  AlertCircle,
  Plus,
  Eye,
  Bell,
  ChevronDown,
  LogOut,
  ChevronUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Sidebar } from "@/components/sidebar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/components/auth-provider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import api from "@/lib/api"

interface User {
  id: number
  name: string
  email?: string
  password?: string
  photo_url?: string
  phone?: string
  role?: string
  status?: number | string
  outlets?: number[] | string
  company?: {
    id: number
    name: string
  }
  created_at?: string
  updated_at?: string
  selected: boolean
}

interface PaginationMeta {
  current_page: number
  from: number
  last_page: number
  links: Array<{
    url: string | null
    label: string
    active: boolean
  }>
  path: string
  per_page: number
  to: number
  total: number
}

interface ApiResponse {
  data: Array<Omit<User, "selected">>
  links?: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
  meta?: PaginationMeta
}

export default function UserPage() {
  const { userEmail, logout } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [perPage, setPerPage] = useState("10")
  const [currentPage, setCurrentPage] = useState(1)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [selectedOutletIds, setSelectedOutletIds] = useState<number[]>([])
  const [availableOutlets, setAvailableOutlets] = useState<any[]>([])
  const [newUserName, setNewUserName] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")
  const [newUserPhoto, setNewUserPhoto] = useState<File | null>(null)
  const [newUserPhotoPreview, setNewUserPhotoPreview] = useState<string | null>(
    null
  )
  const [photoError, setPhotoError] = useState<string>("")
  const [newUserPhone, setNewUserPhone] = useState("")
  const [newUserOutlets, setNewUserOutlets] = useState("")
  const [newUserRole, setNewUserRole] = useState("")
  const [newUserStatus, setNewUserStatus] = useState<string>("")
  const [editUserName, setEditUserName] = useState("")
  const [editUserEmail, setEditUserEmail] = useState("")
  const [editUserPassword, setEditUserPassword] = useState("")
  const [editUserPhoto, setEditUserPhoto] = useState<File | null>(null)
  const [editUserPhotoPreview, setEditUserPhotoPreview] = useState<
    string | null
  >(null)
  const [editUserPhone, setEditUserPhone] = useState("")
  const [editUserOutlets, setEditUserOutlets] = useState("")
  const [editUserRole, setEditUserRole] = useState("")
  const [editUserStatus, setEditUserStatus] = useState<string>("")
  const [editUserId, setEditUserId] = useState<number | null>(null)
  const [nameError, setNameError] = useState("")
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [outletsError, setOutletsError] = useState("")
  const [roleError, setRoleError] = useState("")
  const [statusError, setStatusError] = useState("")
  const [editNameError, setEditNameError] = useState("")
  const [editEmailError, setEditEmailError] = useState("")
  const [editPasswordError, setEditPasswordError] = useState("")
  const [editPhotoError, setEditPhotoError] = useState("")
  const [editPhoneError, setEditPhoneError] = useState("")
  const [editOutletsError, setEditOutletsError] = useState("")
  const [editRoleError, setEditRoleError] = useState("")
  const [editStatusError, setEditStatusError] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(
    null
  )

  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])

  const fetchUsers = async () => {
    setLoading(true)
    setError("")

    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "{}")
      const companyId = auth.companyId || "1"

      const response = await api.get<ApiResponse>(`/v1/app/users`, {
        params: {
          page: currentPage,
          size: perPage,
          search: searchQuery,
          company_id: companyId,
          sortBy: "",
        },
      })

      const usersWithSelection = response.data.data.map((user) => ({
        ...user,
        selected: false,
      }))

      setUsers(usersWithSelection)
      setFilteredUsers(usersWithSelection)

      if (response.data.meta) {
        setPaginationMeta(response.data.meta)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch users")
      console.error("Error fetching users:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchOutlets = async () => {
    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "{}")
      const companyId = auth.companyId || "1"
      const response = await api.get(`/v1/app/outlets`, {
        params: {
          page: 1,
          size: 100,
          search: "",
          company_id: companyId,
          sortBy: "",
        },
      })

      const data = response.data.data

      if (Array.isArray(data)) {
        setAvailableOutlets(data)
      } else {
        console.warn("Data outlet tidak berupa array, mengatur ke array kosong")
        setAvailableOutlets([])
      }
    } catch (err: any) {
      console.error("Gagal mengambil data outlet:", err)
      setAvailableOutlets([])
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchOutlets()
  }, [currentPage, perPage, searchQuery])

  const fetchOutletDetail = async (id: number) => {
    try {
      const companyId = localStorage.getItem("company_id") || "1"
      const response = await api.get(`/v1/app/outlets/${id}`)

      if (response.data && response.data.data) {
        return response.data.data
      } else {
        console.warn("Data outlet tidak ditemukan")
        return null
      }
    } catch (err) {
      console.error("Gagal mengambil detail outlet:", err)
      return null
    }
  }

  const toggleSelectAll = () => {
    const allSelected = filteredUsers.every((user) => user.selected)
    setUsers(
      users.map((user) => {
        if (filteredUsers.some((fc) => fc.id === user.id)) {
          return { ...user, selected: !allSelected }
        }
        return user
      })
    )
    setFilteredUsers(
      filteredUsers.map((user) => ({
        ...user,
        selected: !allSelected,
      }))
    )
  }

  const toggleSelectUser = (id: number) => {
    setUsers(
      users.map((user) =>
        user.id === id ? { ...user, selected: !user.selected } : user
      )
    )
    setFilteredUsers(
      filteredUsers.map((user) =>
        user.id === id ? { ...user, selected: !user.selected } : user
      )
    )
  }

  const deleteSelected = async () => {
    try {
      const selectedIds = users
        .filter((user) => user.selected)
        .map((user) => user.id)

      for (const id of selectedIds) {
        await api.delete(`/v1/app/users/${id}`)
      }

      fetchUsers()
      setShowDeleteDialog(false)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete users")
      console.error("Error deleting users:", err)
    }
  }

  const toggleOutlet = (id: number) => {
    setSelectedOutletIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const addUsers = async () => {
    let hasError = false
    setIsSubmitting(true)

    if (!newUserName.trim()) {
      setNameError("Nama staff tidak boleh kosong")
      hasError = true
    }

    if (!newUserEmail.trim()) {
      setEmailError("Email staff tidak boleh kosong")
      hasError = true
    }

    if (!newUserPassword.trim()) {
      setPasswordError("Password staff tidak boleh kosong")
      hasError = true
    }

    if (!String(newUserPhone).trim()) {
      setPhoneError("Nomor HP staff tidak boleh kosong")
      hasError = true
    }

    if (!selectedOutletIds || selectedOutletIds.length === 0) {
      console.log("Role kosonggg")
      setOutletsError("Outlet staff tidak boleh kosong")
      hasError = true
    }

    if (!newUserRole.trim()) {
      console.log("Role kosong")
      setRoleError("Role staff tidak boleh kosong")
      hasError = true
    }

    if (newUserStatus !== "0" && newUserStatus !== "1") {
      console.log("Status kosong")
      setStatusError("Status staff tidak valid")
      hasError = true
    }

    if (hasError) {
      setIsSubmitting(false)
      return
    }

    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "{}")
      const companyId = auth.companyId || "1"

      const selectedOutlets = selectedOutletIds
      setNewUserOutlets(JSON.stringify(selectedOutlets))

      const formData = new FormData()
      formData.append("company_id", companyId)
      formData.append("name", newUserName.trim())
      formData.append("email", newUserEmail.trim())
      formData.append("password", newUserPassword.trim())
      formData.append("phone", String(newUserPhone).trim())
      formData.append("outlets", JSON.stringify(selectedOutletIds))
      formData.append("role", newUserRole.trim())
      formData.append("status", String(Number(newUserStatus)))

      if (newUserPhoto && typeof newUserPhoto !== "string") {
        formData.append("photo", newUserPhoto)
      }

      await api.post("/v1/app/users", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      setNewUserName("")
      setNewUserEmail("")
      setNewUserPassword("")
      if (newUserPhotoPreview) {
        URL.revokeObjectURL(newUserPhotoPreview)
      }
      setNewUserPhoto(null)
      setNewUserPhotoPreview(null)
      setNewUserPhone("")
      setNewUserOutlets("")
      setNewUserRole("")
      setNewUserStatus("")

      setNameError("")
      setEmailError("")
      setPasswordError("")
      setPhotoError("")
      setPhoneError("")
      setOutletsError("")
      setRoleError("")
      setStatusError("")

      setShowAddDialog(false)
      fetchUsers()
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors
        console.error("Validation errors:", errors)
        if (errors.name) setNameError(errors.name[0])
        if (errors.email) setEmailError(errors.email[0])
        if (errors.password) setPasswordError(errors.password[0])
        if (errors.photo) setPhotoError(errors.photo[0])
        if (errors.phone) setPhoneError(errors.phone[0])
        if (errors.outlets) setOutletsError(errors.outlets[0])
        if (errors.role) setRoleError(errors.role[0])
        if (errors.status) setStatusError(errors.status[0])
      } else {
        setError(err.response?.data?.message || "Gagal menambahkan staff")
      }
      console.error("Error adding user:", err.response?.data || err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const editUsers = async () => {
    let hasError = false
    setIsSubmitting(true)

    if (!editUserName.trim()) {
      setEditNameError("Nama staff tidak boleh kosong")
      hasError = true
    }
    if (!editUserEmail.trim()) {
      setEditEmailError("Email staff tidak boleh kosong")
      hasError = true
    }
    if (!String(editUserPhone).trim()) {
      setEditPhoneError("Nomor HP staff tidak boleh kosong")
      hasError = true
    }
    if (!selectedOutletIds.length) {
      setEditOutletsError("Outlets staff tidak boleh kosong")
      hasError = true
    }
    if (!editUserRole.trim()) {
      setEditRoleError("Role staff tidak boleh kosong")
      hasError = true
    }
    if (editUserStatus !== "0" && editUserStatus !== "1") {
      setEditStatusError("Status staff tidak valid")
      hasError = true
    }

    if (editUserPassword.trim() && !editUserPassword) {
      setEditPasswordError("Password staff tidak boleh kosong")
      hasError = true
    }

    if (hasError || !editUserId) {
      setIsSubmitting(false)
      return
    }

    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "{}")
      const companyId = auth.companyId || "1"

      const formData = new FormData()

      formData.append("company_id", companyId)
      formData.append("name", editUserName.trim())
      formData.append("email", editUserEmail.trim())
      if (editUserPassword.trim()) {
        formData.append("password", editUserPassword.trim())
      }
      formData.append("phone", String(editUserPhone).trim())
      formData.append("role", editUserRole.trim())
      formData.append("status", editUserStatus)
      formData.append("outlets", JSON.stringify(selectedOutletIds))

      if (editUserPhoto) {
        formData.append("photo", editUserPhoto)
      }

      await api.post(`/v1/app/users/${editUserId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      setEditUserName("")
      setEditUserEmail("")
      setEditUserPassword("")
      setEditUserPhoto(null)
      setEditUserPhotoPreview(null)
      setEditUserPhone("")
      setEditUserOutlets("")
      setEditUserRole("")
      setEditUserStatus("")

      setEditNameError("")
      setEditEmailError("")
      setEditPasswordError("")
      setEditPhotoError("")
      setEditPhoneError("")
      setEditOutletsError("")
      setEditRoleError("")
      setEditStatusError("")
      setError("")

      setShowEditDialog(false)
      fetchUsers()
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors
        if (errors.name) setEditNameError(errors.name[0])
        if (errors.email) setEditEmailError(errors.email[0])
        if (errors.password) setEditPasswordError(errors.password[0])
        if (errors.photo) setEditPhotoError(errors.photo[0])
        if (errors.phone) setEditPhoneError(errors.phone[0])
        if (errors.outlets) setEditOutletsError(errors.outlets[0])
        if (errors.role) setEditRoleError(errors.role[0])
        if (errors.status) setEditStatusError(errors.status[0])
      } else {
        setError(err.response?.data?.message || "Gagal mengupdate data user")
      }
      console.error("Error updating user:", err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleImport = async () => {
    if (!selectedFile) return

    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "{}")
      const companyId = auth.companyId || "1"

      const formData = new FormData()
      formData.append("company_id", companyId)
      formData.append("file", selectedFile)

      await api.post("/v1/app/users/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      setSelectedFile(null)
      setShowImportDialog(false)

      fetchUsers()
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to import users")
      console.error("Error importing users:", err)
    }
  }

  const downloadTemplate = async () => {
    try {
      const response = await api.get("/v1/app/brands/template", {
        responseType: "blob",
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "brand_template.xlsx")
      document.body.appendChild(link)
      link.click()

      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to download template")
      console.error("Error downloading template:", err)
    }
  }

  const handleExport = async () => {
    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "{}")
      const companyId = auth.companyId || "1"

      const formData = new FormData()
      formData.append("company_id", companyId)
      formData.append("password", "password")
      formData.append("password_confirm", "password")

      const response = await api.post("/v1/app/users/export", formData, {
        responseType: "blob",
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "users_export.xlsx")
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err: any) {
      setError("Gagal mengekspor data staff")
      console.error("Error exporting users:", err)
    }
  }

  const handleOpenAddDialog = () => {
    setNewUserName("")
    setNewUserEmail("")
    setNewUserPassword("")
    setNewUserPhoto(null)
    setNewUserPhone("")
    setNewUserOutlets("")
    setNewUserRole("")
    setNewUserStatus("")
    setSelectedOutletIds([])

    setNameError("")
    setEmailError("")
    setPasswordError("")
    setPhotoError("")
    setPhoneError("")
    setOutletsError("")
    setRoleError("")
    setStatusError("")

    setShowAddDialog(true)
  }

  const handleOpenEditDialog = (user: User) => {
    setEditUserId(user.id)
    setEditUserName(user.name || "")
    setEditUserEmail(user.email || "")
    setEditUserPassword(user.password || "")
    setEditUserPhoto(null)
    setEditUserPhotoPreview(user.photo_url ?? null)
    setEditUserPhone(user.phone || "")
    setEditUserOutlets(
      Array.isArray(user.outlets) ? user.outlets.join(",") : user.outlets || ""
    )
    setEditUserRole(user.role || "")
    setEditUserStatus(user.status?.toString() || "")

    setSelectedOutletIds(
      Array.isArray(user.outlets) ? user.outlets.map((o: any) => o.id) : []
    )

    setEditNameError("")
    setEditEmailError("")
    setEditPasswordError("")
    setEditPhotoError("")
    setEditPhoneError("")
    setEditOutletsError("")
    setEditRoleError("")
    setEditStatusError("")

    setShowEditDialog(true)
  }

  const handleViewUsers = (userId: number) => {
    router.push(`/pengaturan/staff/${userId}`)
  }

  const handleOpenImportDialog = () => {
    setSelectedFile(null)
    setShowImportDialog(true)
  }

  const handleLogout = () => {
    logout()
    router.replace("/login")
  }

  const allSelected =
    filteredUsers.length > 0 && filteredUsers.every((user) => user.selected)

  const anySelected = users.some((user) => user.selected)

  const selectedUsers = users.filter((user) => user.selected)

  const getConfirmationMessage = () => {
    if (allSelected) {
      return "Apakah Anda yakin ingin menghapus semua?"
    } else if (selectedUsers.length > 3) {
      return "Apakah Anda yakin ingin menghapus yang terpilih?"
    } else if (selectedUsers.length === 1) {
      return `Apakah Anda yakin ingin menghapus "${selectedUsers[0].name}"?`
    } else {
      const brandNames = selectedUsers.map((user) => user.name).join('", "')
      return `Apakah Anda yakin ingin menghapus "${brandNames}"?`
    }
  }

  const handlePageChange = (page: number) => {
    if (paginationMeta && page > 0 && page <= paginationMeta.last_page) {
      setCurrentPage(page)
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar className="h-screen hidden md:block" />
      <div className="flex-1 w-full">
        <header className="flex items-center justify-between bg-white px-6 py-4 shadow-sm">
          <h1 className="text-2xl font-semibold"></h1>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {userEmail ? userEmail[0].toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span>{userEmail ? userEmail.split("@")[0] : "User"}</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Manajemen Staff</h2>
            <p className="text-sm text-gray-500">
              Pengaturan - Manajemen Staff
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Select
                  value={perPage}
                  onValueChange={(value) => {
                    setPerPage(value)
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-16">
                    <SelectValue placeholder="10" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search"
                    className="w-64 pl-9"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="flex items-center gap-1"
                    onClick={handleOpenImportDialog}
                  >
                    <ChevronDown className="h-4 w-4" />
                    Import Data
                  </Button>

                  <Button
                    variant="outline"
                    className="flex items-center gap-1"
                    onClick={handleExport}
                  >
                    <ChevronUp className="h-4 w-4" />
                    Export Data
                  </Button>

                  {anySelected && (
                    <Button
                      variant="destructive"
                      className="flex items-center gap-1"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Hapus terpilih
                    </Button>
                  )}

                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleOpenAddDialog}
                  >
                    <Plus className="mr-1 h-4 w-4" /> Buat Baru
                  </Button>
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow className="hover:bg-gray-50">
                    <TableHead className="w-12 p-4">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-12 p-4">Nama</TableHead>
                    <TableHead className="p-4">Email</TableHead>
                    <TableHead className="p-4">No. Hp</TableHead>
                    <TableHead className="p-4">Cabang</TableHead>
                    <TableHead className="p-4">Role</TableHead>
                    <TableHead className="p-4">Status</TableHead>
                    <TableHead className="w-24 p-4">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user, index) => (
                      <TableRow
                        key={user.id}
                        className={
                          index % 2 === 0
                            ? "bg-white hover:bg-gray-50"
                            : "bg-gray-50/30 hover:bg-gray-50"
                        }
                      >
                        <TableCell className="p-4 border-t border-gray-100">
                          <Checkbox
                            checked={user.selected}
                            onCheckedChange={() => toggleSelectUser(user.id)}
                          />
                        </TableCell>
                        <TableCell className="p-4 border-t border-gray-100">
                          {user.name}
                        </TableCell>
                        <TableCell className="p-4 border-t border-gray-100">
                          {user.email}
                        </TableCell>
                        <TableCell className="p-4 border-t border-gray-100">
                          {user.phone}
                        </TableCell>
                        <TableCell className="p-4 border-t border-gray-100">
                          {Array.isArray(user.outlets)
                            ? user.outlets
                                .map((outlet: any) => outlet.name)
                                .join(", ")
                            : ""}
                        </TableCell>
                        <TableCell className="p-4 border-t border-gray-100">
                          {user.role}
                        </TableCell>
                        <TableCell className="p-4 border-t border-gray-100">
                          {user.status === 1 ? "🟢 Aktif" : "🔴 Tidak Aktif"}
                        </TableCell>
                        <TableCell className="p-4 border-t border-gray-100">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleViewUsers(user.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleOpenEditDialog(user)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setUsers(
                                  users.map((c) =>
                                    c.id === user.id
                                      ? { ...c, selected: true }
                                      : c
                                  )
                                )
                                setFilteredUsers(
                                  filteredUsers.map((c) =>
                                    c.id === user.id
                                      ? { ...c, selected: true }
                                      : c
                                  )
                                )
                                setShowDeleteDialog(true)
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Tidak ada data yang ditemukan
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {paginationMeta && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {paginationMeta.from} to {paginationMeta.to} of{" "}
                  {paginationMeta.total} entries
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>

                  {Array.from(
                    { length: Math.min(3, paginationMeta.last_page) },
                    (_, i) => i + 1
                  ).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className={
                        currentPage === page
                          ? "bg-blue-600 hover:bg-blue-700"
                          : ""
                      }
                    >
                      {page}
                    </Button>
                  ))}

                  {paginationMeta.last_page > 3 && currentPage > 3 && (
                    <>
                      <span className="px-2">...</span>
                      <Button
                        variant={
                          currentPage === paginationMeta.last_page
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() =>
                          handlePageChange(paginationMeta.last_page)
                        }
                        className={
                          currentPage === paginationMeta.last_page
                            ? "bg-blue-600 hover:bg-blue-700"
                            : ""
                        }
                      >
                        {paginationMeta.last_page}
                      </Button>
                    </>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === paginationMeta.last_page}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-center text-xl">Hapus</DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-center py-2">
            {getConfirmationMessage()}
          </DialogDescription>
          <DialogFooter className="flex justify-center gap-2 sm:justify-center">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Batal
            </Button>
            <Button variant="destructive" onClick={deleteSelected}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Tambah Staff</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-name">Nama Lengkap</Label>
                <Input
                  id="user-name"
                  value={newUserName}
                  onChange={(e) => {
                    setNewUserName(e.target.value)
                    setNameError("")
                  }}
                  placeholder="Masukkan Nama Lengkap Anda"
                />
                {nameError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">
                      {nameError}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-email">Email</Label>
                <Input
                  id="user-email"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="you@company.com"
                />
                {emailError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">
                      {emailError}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-password">Password</Label>
                <div className="relative">
                  <Input
                    id="user-password"
                    type={showPassword ? "text" : "password"}
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="Masukkan Password Anda"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">
                      {passwordError}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="user-photo"
                  className="block text-sm font-medium text-gray-700"
                >
                  Foto Profil (Opsional)
                </Label>

                <div className="flex items-center space-x-4">
                  {newUserPhotoPreview ? (
                    <img
                      src={newUserPhotoPreview}
                      alt="Preview Foto"
                      className="w-20 h-20 rounded-full object-cover border border-gray-300"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                      <ImageIcon className="w-10 h-10" />
                    </div>
                  )}
                </div>

                <Input
                  id="user-photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]

                    if (newUserPhotoPreview) {
                      URL.revokeObjectURL(newUserPhotoPreview) // Revoke URL lama
                    }

                    if (file) {
                      setNewUserPhoto(file)
                      setNewUserPhotoPreview(URL.createObjectURL(file))
                      setPhotoError("")
                    } else {
                      setNewUserPhoto(null)
                      setNewUserPhotoPreview(null)
                    }
                  }}
                  className="mt-2 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border file:border-gray-200 file:bg-gray-100 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
                />

                {photoError && (
                  <p className="text-sm text-red-500">{photoError}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>No HP</Label>
                <div className="flex gap-2">
                  <Input className="w-20" value="+62" disabled />
                  <Input
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value)}
                    placeholder="81XXXX"
                  />
                </div>
                {phoneError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">
                      {phoneError}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="outlet-select" className="text-sm font-medium">
                  Cabang
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn("w-full justify-between font-normal")}
                    >
                      {selectedOutletIds.length > 0
                        ? availableOutlets
                            .filter((outlet) =>
                              selectedOutletIds.includes(outlet.id)
                            )
                            .map((outlet) => outlet.name)
                            .join(", ")
                        : "Pilih Cabang"}
                      <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-2 space-y-2 max-h-48 overflow-y-auto">
                    {availableOutlets.map((outlet) => (
                      <div
                        key={outlet.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`outlet-${outlet.id}`}
                          checked={selectedOutletIds.includes(outlet.id)}
                          onCheckedChange={() => toggleOutlet(outlet.id)}
                        />
                        <label
                          htmlFor={`outlet-${outlet.id}`}
                          className="text-sm"
                        >
                          {outlet.name}
                        </label>
                      </div>
                    ))}
                  </PopoverContent>
                </Popover>
                {outletsError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">
                      {outletsError}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={newUserRole} onValueChange={setNewUserRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Owner">Owner</SelectItem>
                    <SelectItem value="Administrator">Administrator</SelectItem>
                    <SelectItem value="Manajer">Manajer</SelectItem>
                    <SelectItem value="Kasir">Kasir</SelectItem>
                  </SelectContent>
                </Select>
                {roleError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">
                      {roleError}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={newUserStatus}
                  onValueChange={(value) => setNewUserStatus(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">🟢 Aktif</SelectItem>
                    <SelectItem value="0">🔴 Tidak Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {statusError && (
              <Alert variant="destructive" className="py-2 mt-2">
                <AlertDescription className="text-sm">
                  {statusError}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="sm:justify-end">
            <DialogClose asChild>
              <Button
                variant="outline"
                className="bg-red-600  hover:bg-red-700 text-white"
              >
                Batal
              </Button>
            </DialogClose>
            <Button
              onClick={addUsers}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? "Menambahkan..." : "Tambah"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Staff</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-user-name">Nama Lengkap</Label>
                <Input
                  id="edit-user-name"
                  value={editUserName}
                  onChange={(e) => {
                    setEditUserName(e.target.value)
                    setNameError("")
                  }}
                  placeholder="Masukkan Nama Lengkap Anda"
                />
                {editNameError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">
                      {editNameError}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-user-email">Email</Label>
                <Input
                  id="edit-user-email"
                  value={editUserEmail}
                  onChange={(e) => setEditUserEmail(e.target.value)}
                  placeholder="you@company.com"
                />
                {editEmailError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">
                      {editEmailError}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="user-password">Password</Label>
                <div className="relative">
                  <Input
                    id="user-password"
                    type={showPassword ? "text" : "password"}
                    value={editUserPassword}
                    onChange={(e) => setEditUserPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {editPasswordError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">
                      {editPasswordError}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label>No HP</Label>
                <div className="flex gap-2">
                  <Input className="w-20" value="+62" disabled />
                  <Input
                    value={editUserPhone}
                    onChange={(e) => setEditUserPhone(e.target.value)}
                    placeholder="8123456789"
                  />
                </div>
                {editPhoneError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">
                      {editPhoneError}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-user-photo">Foto Profil</Label>
                <div className="flex items-center space-x-4">
                  {editUserPhotoPreview ? (
                    <img
                      src={editUserPhotoPreview}
                      alt="Preview Foto"
                      className="w-20 h-20 rounded-full object-cover border border-gray-300"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                      <ImageIcon className="w-10 h-10" />
                    </div>
                  )}
                </div>
                <Input
                  id="edit-user-photo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setEditUserPhoto(file)
                      const previewUrl = URL.createObjectURL(file)
                      setEditUserPhotoPreview(previewUrl)
                      console.log("Preview URL:", previewUrl)
                      setPhotoError("")
                    }
                  }}
                  className="mt-2 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border file:border-gray-200 file:bg-gray-100 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="edit-outlet-select"
                  className="text-sm font-medium"
                >
                  Cabang
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal"
                    >
                      {selectedOutletIds.length > 0
                        ? availableOutlets
                            .filter((outlet) =>
                              selectedOutletIds.includes(outlet.id)
                            )
                            .map((outlet) => outlet.name)
                            .join(", ")
                        : "Pilih Cabang"}
                      <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[200px] p-2 space-y-2 max-h-48 overflow-y-auto">
                    {availableOutlets.map((outlet) => (
                      <div
                        key={outlet.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`edit-outlet-${outlet.id}`}
                          checked={selectedOutletIds.includes(outlet.id)}
                          onCheckedChange={() => {
                            setSelectedOutletIds((prev) =>
                              prev.includes(outlet.id)
                                ? prev.filter((id) => id !== outlet.id)
                                : [...prev, outlet.id]
                            )
                          }}
                        />
                        <label
                          htmlFor={`edit-outlet-${outlet.id}`}
                          className="text-sm"
                        >
                          {outlet.name}
                        </label>
                      </div>
                    ))}
                  </PopoverContent>
                </Popover>
                {editOutletsError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">
                      {editOutletsError}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={editUserRole} onValueChange={setEditUserRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Owner">Owner</SelectItem>
                    <SelectItem value="Administrator">Administrator</SelectItem>
                    <SelectItem value="Manajer">Manajer</SelectItem>
                    <SelectItem value="Kasir">Kasir</SelectItem>
                  </SelectContent>
                </Select>
                {editRoleError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">
                      {editRoleError}
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editUserStatus}
                  onValueChange={setEditUserStatus}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">🟢 Aktif</SelectItem>
                    <SelectItem value="0">🔴 Tidak Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {editStatusError && (
              <Alert variant="destructive" className="py-2 mt-2">
                <AlertDescription className="text-sm">
                  {editStatusError}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="sm:justify-end">
            <DialogClose asChild>
              <Button
                variant="outline"
                className="bg-red-600  hover:bg-red-700 text-white"
              >
                Batal
              </Button>
            </DialogClose>
            <Button
              onClick={editUsers}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Import Data</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-6">
              <div>
                <p className="mb-2">
                  Unduh
                  <Button
                    variant="link"
                    className="p-0 h-auto text-blue-600 hover:underline"
                    onClick={downloadTemplate}
                  >
                    Template
                  </Button>
                </p>
              </div>

              <div>
                <p className="mb-2">Pilih File</p>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer rounded-md border bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200"
                  >
                    Choose File
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <span className="text-sm text-gray-500">
                    {selectedFile
                      ? selectedFile.name
                      : "Tidak Ada File Yang Dipilih"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="destructive"
              onClick={() => setShowImportDialog(false)}
            >
              Batal
            </Button>
            <Button
              onClick={handleImport}
              className="bg-green-600 hover:bg-green-700"
              disabled={!selectedFile}
            >
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
