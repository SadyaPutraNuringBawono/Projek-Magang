"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Pencil,
  X,
  Search,
  Trash2,
  AlertCircle,
  Plus,
  Bell,
  ChevronUp,
  ChevronDown,
  LogOut,
  Menu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
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
import {
  useSuccessNotification,
  SuccessNotification,
} from "@/components/success-notification"
import api from "@/lib/api"

interface Biaya {
  id: number
  title: string
  amount: number
  company?: {
    id: number
    name: string
  }
  created_at?: string
  updated_at?: string | null
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
  data: Array<Omit<Biaya, "selected">>
  links?: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
  meta?: PaginationMeta
}

export default function BiayaPage() {
  const { userEmail } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [perPage, setPerPage] = useState("10")
  const [currentPage, setCurrentPage] = useState(1)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [newBiayaName, setNewBiayaName] = useState("")
  const [editBiayaName, setEditBiayaName] = useState("")
  const [newBiayaAmount, setNewBiayaAmount] = useState<string>("")
  const [editBiayaAmount, setEditBiayaAmount] = useState<string>("")
  const [editBiayaId, setEditBiayaId] = useState<number | null>(null)
  const [nameError, setNameError] = useState("")
  const [editNameError, setEditNameError] = useState("")
  const [amountError, setAmountError] = useState("")
  const [editAmountError, setEditAmountError] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(
    null
  )

  const [Biayas, setBiayas] = useState<Biaya[]>([])
  const [filteredBiayas, setFilteredBiayas] = useState<Biaya[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { notification, showSuccess, hideSuccess } = useSuccessNotification()

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("id-ID").format(value)
  }

  const formatNumberWithDots = (numStr: string) => {
    const numeric = numStr.replace(/\D/g, "")
    if (!numeric) return ""
    return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }

  const fetchBiayas = async () => {
    setLoading(true)
    setError("")

    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "{}")
      const companyId = auth.companyId || "1"
      const response = await api.get<ApiResponse>(`/v1/app/costs`, {
        params: {
          page: currentPage,
          size: perPage,
          search: searchQuery,
          company_id: companyId,
          sortBy: "",
        },
      })

      console.log("Fetched data:", response.data.data)

      const BiayasWithSelection = response.data.data.map((Biaya) => ({
        ...Biaya,
        selected: false,
      }))

      setBiayas(BiayasWithSelection)
      setFilteredBiayas(BiayasWithSelection)

      if (response.data.meta) {
        setPaginationMeta(response.data.meta)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch Biayas")
      console.error("Error fetching Biayas:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBiayas()
  }, [currentPage, perPage, searchQuery])

  const toggleSelectAll = () => {
    const allSelected = filteredBiayas.every((Biaya) => Biaya.selected)
    setBiayas(
      Biayas.map((Biaya) => {
        if (filteredBiayas.some((fb) => fb.id === Biaya.id)) {
          return { ...Biaya, selected: !allSelected }
        }
        return Biaya
      })
    )
    setFilteredBiayas(
      filteredBiayas.map((Biaya) => ({
        ...Biaya,
        selected: !allSelected,
      }))
    )
  }

  const toggleSelectBiaya = (id: number) => {
    setBiayas(
      Biayas.map((Biaya) =>
        Biaya.id === id ? { ...Biaya, selected: !Biaya.selected } : Biaya
      )
    )
    setFilteredBiayas(
      filteredBiayas.map((Biaya) =>
        Biaya.id === id ? { ...Biaya, selected: !Biaya.selected } : Biaya
      )
    )
  }

  const deleteSelected = async () => {
    try {
      const selectedIds = Biayas.filter((Biaya) => Biaya.selected).map(
        (Biaya) => Biaya.id
      )

      if (selectedIds.length === 1) {
        await api.delete(`/v1/app/costs/${selectedIds[0]}`)
      } else if (selectedIds.length > 1) {
        await api.delete("/v1/app/costs", {
          data: { ids: selectedIds },
        })
      }

      fetchBiayas()
      setShowDeleteDialog(false)

      showSuccess("Berhasil menghapus data biaya", "Data biaya telah dihapus")
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete Biayas")
      console.error("Error deleting Biayas:", err)
    }
  }

  const addBiaya = async () => {
    let isValid = true

    const trimmedName = newBiayaName.trim()
    const rawAmount = newBiayaAmount.replace(/\./g, "") // hapus titik ribuan

    // Validasi Nama Modul Biaya
    if (!trimmedName) {
      setNameError("Nama modul biaya tidak boleh kosong")
      isValid = false
    } else if (trimmedName.length < 3) {
      setNameError("Nama modul biaya minimal 3 karakter")
      isValid = false
    } else {
      setNameError("")
    }

    // Validasi Nominal Modul Biaya
    if (!rawAmount) {
      setAmountError("Nominal modul biaya tidak boleh kosong")
      isValid = false
    } else if (!/^\d+$/.test(rawAmount)) {
      setAmountError("Nominal modul biaya harus berupa angka")
      isValid = false
    } else {
      setAmountError("")
    }

    if (!isValid) return

    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "{}")
      const companyId = auth.companyId || "1"

      await api.post("/v1/app/costs", {
        company_id: Number.parseInt(companyId),
        title: trimmedName,
        amount: Number(rawAmount),
      })

      setNewBiayaName("")
      setNameError("")
      setNewBiayaAmount("")
      setAmountError("")
      setShowAddDialog(false)

      fetchBiayas()
      showSuccess(
        "Berhasil menambahkan data biaya",
        "Data biaya baru telah ditambahkan"
      )
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors
        if (errors.name) setNameError(errors.name[0])
        if (errors.amount) setAmountError(errors.amount[0])
      } else {
        setError(err.response?.data?.message || "Failed to add Biaya")
      }
      console.error("Error adding Biaya:", err)
    }
  }

  const editBiaya = async () => {
    let isValid = true

    if (!editBiayaName.trim()) {
      setEditNameError("Nama Biaya tidak boleh kosong")
      isValid = false
    } else if (editBiayaName.length < 3) {
      setEditNameError("Nama modul biaya minimal 3 karakter")
      isValid = false
    } else {
      setEditNameError("")
    }

    if (!String(editBiayaAmount).trim()) {
      setEditAmountError("Nominal Biaya tidak boleh kosong")
      isValid = false
    }

    if (!isValid) return

    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "{}")
      const companyId = auth.companyId || "1"

      await api.post(`/v1/app/costs/${editBiayaId}`, {
        company_id: Number.parseInt(companyId),
        title: editBiayaName.trim(),
        amount: editBiayaAmount,
      })

      setEditBiayaName("")
      setEditBiayaId(null)
      setEditNameError("")
      setEditAmountError("")
      setShowEditDialog(false)

      fetchBiayas()
      showSuccess("Berhasil mengubah data biaya", "Data biaya telah diperbarui")
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors
        if (errors.name) setEditNameError(errors.name[0])
        if (errors.amount) setEditAmountError(errors.amount[0])
      } else {
        setError(err.response?.data?.message || "Failed to update Biaya")
      }
      console.error("Error updating Biaya:", err)
    }
  }

  const handleOpenAddDialog = () => {
    setNewBiayaName("")
    setNameError("")
    setNewBiayaAmount("")
    setAmountError("")
    setShowAddDialog(true)
  }

  const handleOpenEditDialog = (Biaya: Biaya) => {
    setEditBiayaId(Biaya.id)
    setEditBiayaName(Biaya.title)
    setEditBiayaAmount(String(Biaya.amount))
    setEditNameError("")
    setEditAmountError("")
    setShowEditDialog(true)
  }

  const allSelected =
    filteredBiayas.length > 0 && filteredBiayas.every((Biaya) => Biaya.selected)

  const anySelected = Biayas.some((Biaya) => Biaya.selected)

  const selectedBiayas = Biayas.filter((Biaya) => Biaya.selected)

  const getConfirmationMessage = () => {
    if (allSelected) {
      return "Apakah Anda yakin ingin menghapus yang terpilih?"
    } else if (selectedBiayas.length === 1) {
      return `Apakah Anda yakin ingin menghapus Biaya "${selectedBiayas[0].title}"?`
    } else {
      const Biayatitle = selectedBiayas.map((Biaya) => Biaya.title).join('", "')
      return `Apakah Anda yakin ingin menghapus Biaya "${Biayatitle}"?`
    }
  }

  const handlePageChange = (page: number) => {
    if (paginationMeta && page > 0 && page <= paginationMeta.last_page) {
      setCurrentPage(page)
    }
  }

  const handleLogout = () => {
    console.log("User logged out")
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#00A651] transform transition-transform duration-200 ease-in-out lg:relative lg:transform-none flex flex-col
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="overflow-y-auto flex-1">
          <Sidebar />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between bg-white px-4 py-4 shadow-sm lg:px-6">
          <div className="flex items-center gap-4">
            <button
              className="p-2 rounded-md lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-semibold hidden sm:block"></h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="hidden sm:flex">
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
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-sm font-medium">
                      {userEmail ? userEmail.split("@")[0] : "User"}
                    </span>
                    <span className="text-xs text-gray-500">{userEmail}</span>
                  </div>
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

        {/* Update action buttons to be responsive */}
        <main className="p-4 lg:p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Modul Biaya</h2>
            <p className="text-sm text-gray-500">Master - Modul Biaya</p>
          </div>

          <div className="rounded-lg bg-white p-4 lg:p-6 shadow-sm">
            <div className="mb-4 space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
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

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="search"
                      placeholder="Search"
                      className="w-full pl-9"
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
                      className="flex items-center justify-center gap-1 flex-1 sm:flex-none"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Hapus terpilih</span>
                      <span className="sm:hidden">Hapus</span>
                    </Button>
                  )}

                  <Button
                    className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
                    onClick={handleOpenAddDialog}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    <span className="hidden sm:inline">Buat Baru</span>
                    <span className="sm:hidden">Tambah</span>
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
                    <TableHead className="w-12 p-4">No</TableHead>
                    <TableHead className="w-[38%] p-4">
                      Nama Modul Biaya
                    </TableHead>
                    <TableHead className="w-[25%] p-4 text-right">
                      Nominal (Rp)
                    </TableHead>
                    <TableHead className="w-[25%] p-4 text-right">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredBiayas.length > 0 ? (
                    filteredBiayas.map((Biaya, index) => (
                      <TableRow
                        key={Biaya.id}
                        className={
                          index % 2 === 0
                            ? "bg-white hover:bg-gray-50"
                            : "bg-gray-50/30 hover:bg-gray-50"
                        }
                      >
                        <TableCell className="p-4 border-t border-gray-100">
                          <Checkbox
                            checked={Biaya.selected}
                            onCheckedChange={() => toggleSelectBiaya(Biaya.id)}
                          />
                        </TableCell>
                        <TableCell className="p-4 border-t border-gray-100">
                          {paginationMeta
                            ? paginationMeta.per_page *
                                (paginationMeta.current_page - 1) +
                              index +
                              1
                            : index + 1}
                        </TableCell>
                        <TableCell className="p-4 border-t border-gray-100">
                          {Biaya.title}
                        </TableCell>
                        <TableCell className="p-4 border-t border-gray-100 text-right">
                          {formatNumber(Biaya.amount)}
                        </TableCell>
                        <TableCell className="p-4 border-t border-gray-100">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleOpenEditDialog(Biaya)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setBiayas(
                                  Biayas.map((b) =>
                                    b.id === Biaya.id
                                      ? { ...b, selected: true }
                                      : b
                                  )
                                )
                                setFilteredBiayas(
                                  filteredBiayas.map((b) =>
                                    b.id === Biaya.id
                                      ? { ...b, selected: true }
                                      : b
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
                      <TableCell colSpan={6} className="h-24 text-center">
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
        <DialogContent className="fixed sm:absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[calc(100%-2rem)] sm:w-full max-w-md rounded-lg bg-white p-4 shadow-lg sm:p-6">
          <DialogHeader className="flex flex-col items-center space-y-2">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
            </div>
            <DialogTitle className="text-base sm:text-lg font-semibold">
              Hapus
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-center text-sm py-2">
            {getConfirmationMessage()}
          </DialogDescription>
          <DialogFooter className="flex justify-center gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              className="h-9 px-4 text-sm"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={deleteSelected}
              className="h-9 px-4 text-sm"
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Modul Biaya</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="Biaya-name">Nama Biaya</Label>
                <Input
                  id="Biaya-name"
                  value={newBiayaName}
                  onChange={(e) => {
                    setNewBiayaName(e.target.value)
                    setNameError("")
                  }}
                  placeholder="Masukkan nama Biaya"
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
                <Label htmlFor="Biaya-amount">Jumlah Biaya</Label>
                <Input
                  id="Biaya-amount"
                  type="text"
                  value={formatNumberWithDots(newBiayaAmount)}
                  onChange={(e) => {
                    const input = e.target.value
                    const numericOnly = input.replace(/\D/g, "")
                    setNewBiayaAmount(numericOnly)
                  }}
                  placeholder="Masukkan Jumlah Biaya"
                />

                {amountError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">
                      {amountError}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button
              onClick={addBiaya}
              className="bg-green-600 hover:bg-green-700"
            >
              Tambah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Modul Biaya</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-Biaya-name">Nama Biaya</Label>
                <Input
                  id="edit-Biaya-name"
                  value={editBiayaName}
                  onChange={(e) => {
                    setEditBiayaName(e.target.value)
                    setEditNameError("")
                  }}
                  placeholder="Masukkan nama Biaya"
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
                <Label htmlFor="edit-Biaya-amount">Jumlah Biaya</Label>
                <Input
                  id="edit-Biaya-amount"
                  type="text"
                  value={formatNumberWithDots(editBiayaAmount)}
                  onChange={(e) => {
                    const input = e.target.value
                    const numericOnly = input.replace(/\D/g, "")
                    setEditBiayaAmount(numericOnly)
                    setEditAmountError("")
                  }}
                  placeholder="Masukkan nama Biaya"
                />
                {editAmountError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">
                      {editAmountError}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button
              onClick={editBiaya}
              className="bg-green-600 hover:bg-green-700"
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <SuccessNotification
        message={notification.message}
        description={notification.description}
        isVisible={notification.isVisible}
        onClose={hideSuccess}
        position="top-4 right-4 left-4 sm:left-auto"
        duration={5000}
        className="max-w-[calc(100%-2rem)] sm:max-w-md"
      />
    </div>
  )
}
