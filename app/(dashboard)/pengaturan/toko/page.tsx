"use client"

import type React from "react"
import { useRouter } from "next/navigation"

import { useState, useEffect } from "react"
import { Pencil, X, ChevronLeft, Search, Trash2, AlertCircle, Plus, Bell, ChevronDown, LogOut, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { useSuccessNotification, SuccessNotification } from "@/components/success-notification"
import api from "@/lib/api"

interface Store {
  id: number
  name: string
  phone?: string
  address?: string
  selected?: boolean
}

interface PaginationMeta {
  current_page: number
  from: number
  last_page: number
  per_page: number
  to: number
  total: number
}

interface ApiResponse {
  data: Store[]
  meta: PaginationMeta
}

export default function StorePage() {
  const { userEmail, logout } = useAuth()
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState("")
  const [perPage, setPerPage] = useState("10")
  const [currentPage, setCurrentPage] = useState(1)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [newStoreName, setNewStoreName] = useState("")
  const [newStorePhone, setNewStorePhone] = useState("")
  const [newStoreAddress, setNewStoreAddress] = useState("")
  const [editStoreName, setEditStoreName] = useState("")
  const [editStorePhone, setEditStorePhone] = useState("")
  const [editStoreAddress, setEditStoreAddress] = useState("")
  const [editStoreId, setEditStoreId] = useState<number | null>(null)
  const [nameError, setNameError] = useState("")
  const [editNameError, setEditNameError] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null)

  const [stores, setStores] = useState<Store[]>([])
  const [filteredStores, setFilteredStores] = useState<Store[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { notification, showSuccess, hideSuccess } = useSuccessNotification()

  const fetchStores = async () => {
    setLoading(true)
    setError("")

    try {
      const companyId = localStorage.getItem("companyId") || "1"
      const response = await api.get<ApiResponse>(`/v1/app/outlets`, {
        params: {
          page: currentPage,
          size: perPage,
          search: searchQuery,
          company_id: companyId,
          sortBy: "",
        },
      })

      const storesWithSelection = response.data.data.map((store) => ({
        ...store,
        selected: false,
        phone: store.phone || "",
        address: store.address || "",
      }))

      setStores(storesWithSelection)
      setFilteredStores(storesWithSelection)

      if (response.data.meta) {
        setPaginationMeta(response.data.meta)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch stores")
      console.error("Error fetching stores:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStores()
  }, [currentPage, perPage, searchQuery])

  const toggleSelectAll = () => {
    const allSelected = filteredStores.every((store) => store.selected)
    setStores(
      stores.map((store) => {
        if (filteredStores.some((fb) => fb.id === store.id)) {
          return { ...store, selected: !allSelected }
        }
        return store
      }),
    )
    setFilteredStores(
      filteredStores.map((store) => ({
        ...store,
        selected: !allSelected,
      })),
    )
  }

  const toggleSelectStore = (id: number) => {
    setStores(stores.map((store) => (store.id === id ? { ...store, selected: !store.selected } : store)))
    setFilteredStores(
      filteredStores.map((store) => (store.id === id ? { ...store, selected: !store.selected } : store)),
    )
  }

  const deleteStores = async () => {
    try {
      const selectedIds = stores.filter((store) => store.selected).map((store) => store.id)

      if (selectedIds.length === 0) {
        setError("Tidak ada data yang dipilih untuk dihapus")
        return
      }

      if (selectedIds.length === 1) {
        await api.delete(`/v1/app/outlets/${selectedIds[0]}`)
      } else if (selectedIds.length > 1) {
        await api.delete("/v1/app/outlets", {
          data: { ids: selectedIds },
          headers: { "Content-Type": "application/json" },
        })
      }

      fetchStores()
      setShowDeleteDialog(false)
      showSuccess(
        "Berhasil menghapus data toko", 
        "Data toko telah dihapus"
      )
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        "Gagal menghapus data toko"
      )
      console.error("Error deleting stores:", err)
    }
  }

  const addStore = async () => {
    if (!newStoreName.trim()) {
      setNameError("Nama Toko tidak boleh kosong")
      return
    }

    try {
      const companyId = localStorage.getItem("companyId") || "1"

      await api.post("/v1/app/outlets", {
        company_id: Number.parseInt(companyId),
        name: newStoreName.trim(),
        phone: newStorePhone.trim(),
        address: newStoreAddress.trim(),
      })

      setNewStoreName("")
      setNewStorePhone("")
      setNewStoreAddress("")
      setNameError("")
      setShowAddDialog(false)

      fetchStores()

      showSuccess(
        "Berhasil menambahkan data toko", 
        "Data toko baru telah ditambahkan"
      )
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors
        if (errors.name) setNameError(errors.name[0])
      } else {
        setError(err.response?.data?.message || "Failed to add store")
      }
      console.error("Error adding store:", err)
    }
  }

  const editStore = async () => {
    if (!editStoreName.trim()) {
      setEditNameError("Nama Toko tidak boleh kosong")
      return
    }

    if (!editStoreId) return

    try {
      const companyId = localStorage.getItem("companyId") || "1"

      await api.post(`/v1/app/outlets/${editStoreId}`, {
        company_id: Number.parseInt(companyId),
        name: editStoreName.trim(),
        phone: editStorePhone.trim(),
        address: editStoreAddress.trim(),
      })

      setEditStoreName("")
      setEditStorePhone("")
      setEditStoreAddress("")
      setEditStoreId(null)
      setEditNameError("")
      setShowEditDialog(false)

      fetchStores()

      showSuccess(
        "Berhasil mengubah data toko", 
        "Data toko telah diperbarui"
      )
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors
        if (errors.name) setEditNameError(errors.name[0])
      } else {
        setError(err.response?.data?.message || "Failed to update store")
      }
      console.error("Error updating store:", err)
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
      const companyId = localStorage.getItem("companyId") || "1"

      const formData = new FormData()
      formData.append("company_id", companyId)
      formData.append("file", selectedFile)

      await api.post("/v1/app/outlets/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      setSelectedFile(null)
      setShowImportDialog(false)

      fetchStores()
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to import stores")
      console.error("Error importing stores:", err)
    }
  }

  const downloadTemplate = async () => {
    try {
      const response = await api.get("/v1/app/outlets/template", {
        responseType: "blob",
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "Toko_template.xlsx")
      document.body.appendChild(link)
      link.click()

      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to download template")
      console.error("Error downloading template:", err)
    }
  }

  const handleOpenAddDialog = () => {
    setNewStoreName("")
    setNewStorePhone("")
    setNewStoreAddress("")
    setNameError("")
    setShowAddDialog(true)
  }

  const handleOpenEditDialog = (store: Store) => {
    setEditStoreId(store.id)
    setEditStoreName(store.name)
    setEditStorePhone(store.phone || "")
    setEditStoreAddress(store.address || "")
    setEditNameError("")
    setShowEditDialog(true)
  }

  const handleOpenImportDialog = () => {
    setSelectedFile(null)
    setShowImportDialog(true)
  }

  const allSelected = filteredStores.length > 0 && filteredStores.every((store) => store.selected)

  const anySelected = stores.some((store) => store.selected)

  const selectedStores = stores.filter((store) => store.selected)

  const getConfirmationMessage = () => {
    if (allSelected) {
      return "Apakah Anda yakin ingin menghapus yang terpilih?"
    } else if (selectedStores.length === 1) {
      return `Apakah Anda yakin ingin menghapus Toko "${selectedStores[0].name}"?`
    } else {
      const storeNames = selectedStores.map((store) => store.name).join('", "')
      return `Apakah Anda yakin ingin menghapus Toko "${storeNames}"?`
    }
  }

  const handlePageChange = (page: number) => {
    if (paginationMeta && page > 0 && page <= paginationMeta.last_page) {
      setCurrentPage(page)
    }
  }

  const handleLogout = async () => {
    await logout() // Pastikan ini membersihkan token/session
    router.push("/login") // Redirect ke halaman login
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
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#00A651] transform transition-transform duration-200 ease-in-out lg:relative lg:transform-none flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
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
                    <AvatarFallback>{userEmail ? userEmail[0].toUpperCase() : "U"}</AvatarFallback>
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
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
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
            <h2 className="text-xl font-semibold">Toko</h2>
            <p className="text-sm text-gray-500">Master - Toko</p>
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

                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-1 flex-1 sm:flex-none"
                      onClick={handleOpenImportDialog}
                    >
                      <span className="hidden sm:inline">Import Data</span>
                      <span className="sm:hidden">Import</span>
                    </Button>

                    {/* Moved delete button here */}
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
                    {/* HAPUS KOLOM KOTAK PERSEGI (Checkbox) */}
                    {/* <TableHead className="w-12 p-4"></TableHead> */}
                    <TableHead className="w-12 p-4">No</TableHead>
                    <TableHead className="p-4">Nama</TableHead>
                    <TableHead className="p-4">No HP</TableHead>
                    <TableHead className="p-4">Alamat</TableHead>
                    <TableHead className="w-24 p-4 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredStores.length > 0 ? (
                    filteredStores.map((store, index) => (
                      <TableRow
                        key={store.id}
                        className={index % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50/30 hover:bg-gray-50"}
                      >
                        {/* HAPUS KOLOM KOTAK PERSEGI (Checkbox) */}
                        {/* <TableCell className="p-4 border-t border-gray-100">
                          <Checkbox checked={store.selected} onChange={() => toggleSelectStore(store.id)} />
                        </TableCell> */}
                        <TableCell className="p-4 border-t border-gray-100">
                          {paginationMeta
                            ? paginationMeta.per_page * (paginationMeta.current_page - 1) + index + 1
                            : index + 1}
                        </TableCell>
                        <TableCell className="p-4 border-t border-gray-100">{store.name}</TableCell>
                        <TableCell className="p-4 border-t border-gray-100">{store.phone || "-"}</TableCell>
                        <TableCell className="p-4 border-t border-gray-100">{store.address || "-"}</TableCell>
                        <TableCell className="p-4 border-t border-gray-100">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleOpenEditDialog(store)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {/* Hapus tombol X (hapus) berikut */}
                            {/*
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setStores(stores.map((b) => (b.id === store.id ? { ...b, selected: true } : b)))
                                setFilteredStores(
                                  filteredStores.map((b) => (b.id === store.id ? { ...b, selected: true } : b)),
                                )
                                setShowDeleteDialog(true)
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            */}
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
                  {paginationMeta.from} to {paginationMeta.to} of {paginationMeta.total} entries
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

                  {Array.from({ length: Math.min(3, paginationMeta.last_page) }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className={currentPage === page ? "bg-blue-600 hover:bg-blue-700" : ""}
                    >
                      {page}
                    </Button>
                  ))}

                  {paginationMeta.last_page > 3 && currentPage > 3 && (
                    <>
                      <span className="px-2">...</span>
                      <Button
                        variant={currentPage === paginationMeta.last_page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(paginationMeta.last_page)}
                        className={currentPage === paginationMeta.last_page ? "bg-blue-600 hover:bg-blue-700" : ""}
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
            <DialogTitle className="text-base sm:text-lg font-semibold">Hapus</DialogTitle>
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
              onClick={deleteStores}
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
            <DialogTitle>Tambah Toko</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="store-name">Nama</Label>
                <Input
                  id="store-name"
                  value={newStoreName}
                  onChange={(e) => {
                    setNewStoreName(e.target.value)
                    setNameError("")
                  }}
                  placeholder="Masukkan nama Toko"
                />
                {nameError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{nameError}</AlertDescription>
                  </Alert>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="store-phone">No HP</Label>
                <Input
                  id="store-phone"
                  value={newStorePhone}
                  onChange={(e) => setNewStorePhone(e.target.value)}
                  placeholder="Masukkan No HP"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="store-address">Alamat</Label>
                <Input
                  id="store-address"
                  value={newStoreAddress}
                  onChange={(e) => setNewStoreAddress(e.target.value)}
                  placeholder="Masukkan Alamat"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button onClick={addStore} className="bg-green-600 hover:bg-green-700">
              Tambah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Toko</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-store-name">Nama</Label>
                <Input
                  id="edit-store-name"
                  value={editStoreName}
                  onChange={(e) => {
                    setEditStoreName(e.target.value)
                    setEditNameError("")
                  }}
                  placeholder="Masukkan nama Toko"
                />
                {editNameError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{editNameError}</AlertDescription>
                  </Alert>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-store-phone">No HP</Label>
                <Input
                  id="edit-store-phone"
                  value={editStorePhone}
                  onChange={(e) => setEditStorePhone(e.target.value)}
                  placeholder="Masukkan No HP"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-store-address">Alamat</Label>
                <Input
                  id="edit-store-address"
                  value={editStoreAddress}
                  onChange={(e) => setEditStoreAddress(e.target.value)}
                  placeholder="Masukkan Alamat"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button onClick={editStore} className="bg-green-600 hover:bg-green-700">
              Simpan
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
                    {selectedFile ? selectedFile.name : "Tidak Ada File Yang Dipilih"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="destructive" onClick={() => setShowImportDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleImport} className="bg-green-600 hover:bg-green-700" disabled={!selectedFile}>
              Import
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

