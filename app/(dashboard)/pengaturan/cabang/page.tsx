"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Pencil,
  Ban,
  ImageIcon,
  Search,
  Trash2,
  AlertCircle,
  Plus,
  Eye,
  Bell,
  ChevronDown,
  LogOut,
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
  address?: string
  type?: string
  totalStaff?: number
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
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedBranch, setSelectedBranch] = useState<User | null>(null)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [currentDate, setCurrentDate] = useState("")
  const [data, setData] = useState(null)

  const [nameError, setNameError] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(
    null
  )

  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])

  const [newBranchName, setNewBranchName] = useState("")
  const [newBranchPhone, setNewBranchPhone] = useState("")
  const [newBranchAddress, setNewBranchAddress] = useState("")
  const [editBranchName, setEditBranchName] = useState("")
  const [editBranchPhone, setEditBranchPhone] = useState("")
  const [editBranchAddress, setEditBranchAddress] = useState("")

  const [editBranchType, setEditBranchType] = useState("")
  const [showTypeDialog, setShowTypeDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    setError("")

    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "{}")
      const companyId = auth.companyId || "1"
      const response = await api.get(`/v1/app/outlets`, {
        params: {
          page: currentPage, // Halaman saat ini
          size: perPage, // Jumlah data per halaman
          search: searchQuery, // Query pencarian
          company_id: companyId, // ID perusahaan
          sortBy: "", // Tidak ada pengurutan
        },
      })

      const usersWithSelection = response.data.data.map((user: User) => ({
        ...user,
        selected: false,
        status: user.status ?? 1, // Status default: Aktif
      }))

      setUsers(usersWithSelection)
      setFilteredUsers(usersWithSelection)

      if (response.data.meta) {
        setPaginationMeta(response.data.meta)
      }
    } catch (err: any) {
      console.error("Error fetching users:", err.response?.data?.message || err)
      setError(err.response?.data?.message || "Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }

  const fetchOutlets = async () => {
    try {
      const companyId = localStorage.getItem("company_id") || "{}"
      const response = await api.get(
        `/v1/app/outlets/all?company_id=${companyId}`
      )
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

  const handleOpenAddDialog = () => {
    setShowAddDialog(true)
  }

  const handleOpenEditDialog = (branch: User) => {
    setEditBranchName(branch.name || "")
    setEditBranchPhone(branch.phone || "")
    setEditBranchAddress(branch.address || "")
    setSelectedBranch(branch)
    setShowEditDialog(true)
  }

  const handleOpenStatusDialog = (branch: User) => {
    setSelectedBranch(branch)
    setShowStatusDialog(true)
  }

  const handleOpenTypeDialog = (branch: User) => {
    setEditBranchType(branch.type || "Cabang")
    setSelectedBranch(branch)
    setShowTypeDialog(true)
  }

  const toggleBranchStatus = async () => {
    if (!selectedBranch) {
      console.error("No branch selected!"); // Debug log
      return;
    }
  
    try {
      console.log("Sending data to API:", {
        id: selectedBranch.id,
      }); // Debug log
  
      // Kirim permintaan API ke endpoint baru
      const response = await api.get(`/v1/app/outlets/status/${selectedBranch.id}`, {
        headers: {
          Accept: "application/json", // Header sesuai dengan API
        },
      });
  
      console.log("API response:", response.data); // Debug log
  
      // Perbarui status cabang di state
      setUsers((prevUsers) =>
        prevUsers.map((branch) =>
          branch.id === selectedBranch.id
            ? { ...branch, status: branch.status === 1 ? 0 : 1 }
            : branch
        )
      );
  
      setFilteredUsers((prevUsers) =>
        prevUsers.map((branch) =>
          branch.id === selectedBranch.id
            ? { ...branch, status: branch.status === 1 ? 0 : 1 }
            : branch
        )
      );
  
      setShowStatusDialog(false);
      setSelectedBranch(null);
    } catch (err: any) {
      console.error("API error:", err.response?.data || err); // Debug log
      alert("Gagal mengubah status cabang!");
    }
  };

  const handleSaveBranch = () => {
    if (!newBranchName.trim()) {
      setNameError("Nama Wajib Diisi")
      return
    }

    setNameError("")

    // Periksa apakah nama sudah ada
    const existingBranch = users.find(
      (branch) => branch.name === newBranchName
    )

    if (existingBranch) {
      // Jika alamat sudah ada, tambahkan total staf
      const updatedUsers = users.map((branch) =>
        branch.name === newBranchName
          ? { ...branch, totalStaff: (branch.totalStaff || 0) + 1 }
          : branch
      )
      setUsers(updatedUsers)
      setFilteredUsers(updatedUsers) // Perbarui filteredUsers
    } else {
      // Jika alamat baru, tambahkan baris baru
      const newBranch = {
        id: users.length + 1, // ID baru
        name: newBranchName,
        phone: newBranchPhone,
        address: newBranchAddress,
        type: "Cabang", // Default tipe
        totalStaff: 1,
        status: 1, // Status default: Aktif
        selected: false, // Default selected value
      }

      const updatedUsers = [...users, newBranch]
      setUsers(updatedUsers)
      setFilteredUsers(updatedUsers) // Perbarui filteredUsers
    }

    // Reset form dan tutup dialog
    setNewBranchName("")
    setNewBranchPhone("")
    setNewBranchAddress("")
    setShowAddDialog(false)
  }

  const handleSaveEditBranch = () => {
    if (!editBranchName.trim()) {
      alert("Nama cabang tidak boleh kosong!")
      return
    }

    // Perbarui data cabang di state
    const updatedUsers = users.map((branch) =>
      branch.id === selectedBranch?.id
        ? {
            ...branch,
            name: editBranchName,
            phone: editBranchPhone,
            address: editBranchAddress,
          }
        : branch
    )
    setUsers(updatedUsers)
    setFilteredUsers(updatedUsers) // Perbarui filteredUsers

    // Reset form dan tutup dialog
    setEditBranchName("")
    setEditBranchPhone("")
    setEditBranchAddress("")
    setSelectedBranch(null)
    setShowEditDialog(false)
  }

  const handleSaveBranchType = () => {
    if (!selectedBranch) return

    // Perbarui tipe cabang di state
    const updatedUsers = users.map((branch) =>
      branch.id === selectedBranch.id
        ? { ...branch, type: editBranchType }
        : branch
    )
    setUsers(updatedUsers)
    setFilteredUsers(updatedUsers) // Perbarui filteredUsers

    // Reset form dan tutup dialog
    setEditBranchType("")
    setSelectedBranch(null)
    setShowTypeDialog(false)
  }

  const handlePageChange = (page: number) => {
    if (paginationMeta && page > 0 && page <= paginationMeta.last_page) {
      setCurrentPage(page)
    }
  }

  useEffect(() => {
    fetchUsers();
  }, [currentPage, perPage, searchQuery]);

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString("id-ID"))
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log("This runs only on the client.")
    }
  }, [])

  useEffect(() => {
    async function fetchData() {
      const response = await fetch("/api/data")
      const result = await response.json()
      setData(result)
    }

    fetchData()
  }, [])

  const handleLogout = () => {
    logout()
    router.replace("/login")
  }

  const allSelected =
    filteredUsers.length > 0 && filteredUsers.every((user) => user.selected)

  const anySelected = users.some((user) => user.selected)

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1">
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
            <h2 className="text-xl font-semibold">Pengaturan</h2>
            <p className="text-sm text-gray-500">Pengaturan - Cabang/Pusat</p>
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
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="w-12 p-4">No</TableHead>
                    <TableHead className="p-4">Nama</TableHead>
                    <TableHead className="p-4">Alamat</TableHead>
                    <TableHead className="p-4">No. Hp</TableHead>
                    <TableHead className="p-4">Tipe</TableHead>
                    <TableHead className="p-4">Total Staf</TableHead>
                    <TableHead className="p-4">Status</TableHead>
                    <TableHead className="w-24 p-4 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
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
                          {paginationMeta
                            ? paginationMeta.per_page *
                                (paginationMeta.current_page - 1) +
                              index +
                              1
                            : index + 1}
                        </TableCell>
                        <TableCell className="p-4 border-t border-gray-100">
                          {user.name}
                        </TableCell>
                        <TableCell className="p-4 border-t border-gray-100">
                          {user.address || "-"}
                        </TableCell>
                        <TableCell className="p-4 border-t border-gray-100">
                          {user.phone || "-"}
                        </TableCell>
                        <TableCell
                          className="p-4 border-t border-gray-100 cursor-pointer hover:underline"
                          onClick={() => handleOpenTypeDialog(user)}
                        >
                          {user.type || "-"}
                        </TableCell>
                        <TableCell className="p-4 border-t border-gray-100">
                          {user.totalStaff || 0}
                        </TableCell>
                        <TableCell className="p-4 border-t border-gray-100">
                          {user.status === 1 ? (
                            <div className="flex items-center gap-2">
                              <span className="h-3 w-3 rounded-full bg-green-500"></span>
                              <span>Aktif</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="h-3 w-3 rounded-full bg-red-500"></span>
                              <span>Tidak Aktif</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="p-4 border-t border-gray-100 text-right">
                          <div className="flex justify-end gap-2">
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
                              onClick={() => handleOpenStatusDialog(user)}
                            >
                              <Ban className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
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
                        disabled={currentPage === paginationMeta.last_page}
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

          {/* Dialog Buat Baru */}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Tambah Cabang</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div>
                  <Label htmlFor="branch-name">Nama</Label>
                  <Input
                    id="branch-name"
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    placeholder="Masukkan nama cabang"
                  />
                  {nameError && (
                    <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="h-4 w-4" />
                      {nameError}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="branch-phone">No. Hp</Label>
                  <Input
                    id="branch-phone"
                    value={newBranchPhone}
                    onChange={(e) => setNewBranchPhone(e.target.value)}
                    placeholder="Masukkan nomor HP"
                  />
                </div>
                <div>
                  <Label htmlFor="branch-address">Alamat</Label>
                  <Input
                    id="branch-address"
                    value={newBranchAddress}
                    onChange={(e) => setNewBranchAddress(e.target.value)}
                    placeholder="Masukkan alamat cabang"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Batal
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleSaveBranch}
                >
                  Simpan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog Edit */}
          <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Cabang</DialogTitle>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div>
                  <Label htmlFor="edit-branch-name">Nama</Label>
                  <Input
                    id="edit-branch-name"
                    value={editBranchName}
                    onChange={(e) => setEditBranchName(e.target.value)}
                    placeholder="Masukkan nama cabang"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-branch-phone">No. Hp</Label>
                  <Input
                    id="edit-branch-phone"
                    value={editBranchPhone}
                    onChange={(e) => setEditBranchPhone(e.target.value)}
                    placeholder="Masukkan nomor HP"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-branch-address">Alamat</Label>
                  <Input
                    id="edit-branch-address"
                    value={editBranchAddress}
                    onChange={(e) => setEditBranchAddress(e.target.value)}
                    placeholder="Masukkan alamat cabang"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                  Batal
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleSaveEditBranch}
                >
                  Simpan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Dialog Status */}
          <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <DialogTitle className="text-center text-xl">
                  {selectedBranch?.status === 1 ? "Nonaktifkan" : "Aktifkan"}
                </DialogTitle>
              </DialogHeader>
              <DialogDescription className="text-center py-2">
                Apakah Anda yakin ingin{" "}
                {selectedBranch?.status === 1 ? "menonaktifkan" : "mengaktifkan"}{" "}
                <strong>{selectedBranch?.name}</strong>?
              </DialogDescription>
              <DialogFooter className="flex justify-center gap-2 sm:justify-center">
                <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
                  Batal
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={toggleBranchStatus}
                  variant="destructive"
                >
                  {selectedBranch?.status === 1 ? "Nonaktifkan" : "Aktifkan"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  )
}
function setAvailableOutlets(data: any[]) {
  throw new Error("Function not implemented.")
}

