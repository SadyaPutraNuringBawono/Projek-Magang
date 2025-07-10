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

interface Satuan {
  id: number
  name: string
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
  data: Array<Omit<Satuan, "selected">>
  links?: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
  meta?: PaginationMeta
}

export default function SatuanPage() {
  const { userEmail, logout } = useAuth()
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState("")
  const [perPage, setPerPage] = useState("10")
  const [currentPage, setCurrentPage] = useState(1)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [newSatuanName, setNewSatuanName] = useState("")
  const [editSatuanName, setEditSatuanName] = useState("")
  const [editSatuanId, setEditSatuanId] = useState<number | null>(null)
  const [nameError, setNameError] = useState("")
  const [editNameError, setEditNameError] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null)

  const [Satuans, setSatuans] = useState<Satuan[]>([])
  const [filteredSatuans, setFilteredSatuans] = useState<Satuan[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const { notification, showSuccess, hideSuccess } = useSuccessNotification()

  const fetchSatuans = async () => {
    setLoading(true)
    setError("")

    try {
      const companyId = localStorage.getItem("companyId") || "1"
      const response = await api.get<ApiResponse>(`/v1/app/units`, {
        params: {
          page: currentPage,
          size: perPage,
          search: searchQuery,
          company_id: companyId,
          sortBy: "",
        },
      })

      const SatuansWithSelection = response.data.data.map((Satuan) => ({
        ...Satuan,
        selected: false,
      }))

      setSatuans(SatuansWithSelection)
      setFilteredSatuans(SatuansWithSelection)

      if (response.data.meta) {
        setPaginationMeta(response.data.meta)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch Satuans")
      console.error("Error fetching Satuans:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSatuans()
  }, [currentPage, perPage, searchQuery])

  const toggleSelectAll = () => {
    const allSelected = filteredSatuans.every((Satuan) => Satuan.selected)
    setSatuans(
      Satuans.map((Satuan) => {
        if (filteredSatuans.some((fb) => fb.id === Satuan.id)) {
          return { ...Satuan, selected: !allSelected }
        }
        return Satuan
      }),
    )
    setFilteredSatuans(
      filteredSatuans.map((Satuan) => ({
        ...Satuan,
        selected: !allSelected,
      })),
    )
  }

  const toggleSelectSatuan = (id: number) => {
    setSatuans(Satuans.map((Satuan) => (Satuan.id === id ? { ...Satuan, selected: !Satuan.selected } : Satuan)))
    setFilteredSatuans(
      filteredSatuans.map((Satuan) => (Satuan.id === id ? { ...Satuan, selected: !Satuan.selected } : Satuan)),
    )
  }

  const deleteSelected = async () => {
    try {
      const selectedIds = Satuans.filter((Satuan) => Satuan.selected).map((Satuan) => Satuan.id)

      if (selectedIds.length === 1) {
        await api.delete(`/v1/app/units/${selectedIds[0]}`)

      } else if (selectedIds.length > 1) {
        await api.delete("/v1/app/units", {
          data: { ids: selectedIds },
        })
      }

      fetchSatuans()
      setShowDeleteDialog(false)

      showSuccess(
        "Berhasil menghapus data satuan", 
        "Data satuan telah dihapus"
      )
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete Units")
      console.error("Error deleting Satuans:", err)
    }
  }

  const addSatuan = async () => {
    if (!newSatuanName.trim()) {
      setNameError("Nama Satuan tidak boleh kosong")
      return
    }

    try {
      const companyId = localStorage.getItem("companyId") || "1"

      await api.post("/v1/app/units", {
        company_id: Number.parseInt(companyId),
        name: newSatuanName.trim(),
      })

      setNewSatuanName("")
      setNameError("")
      setShowAddDialog(false)

      fetchSatuans()

      showSuccess(
        "Berhasil menambahkan data satuan", 
        "Data satuan baru telah ditambahkan"
      )
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors
        if (errors.name) setNameError(errors.name[0])
      } else {
        setError(err.response?.data?.message || "Failed to add Satuan")
      }
      console.error("Error adding Satuan:", err)
    }
  }

  const editSatuan = async () => {
    if (!editSatuanName.trim()) {
      setEditNameError("Nama Satuan tidak boleh kosong")
      return
    }

    if (!editSatuanId) return

    try {
      const companyId = localStorage.getItem("companyId") || "1"

      await api.post(`/v1/app/units/${editSatuanId}`, {
        company_id: Number.parseInt(companyId),
        name: editSatuanName.trim(),
      })

      setEditSatuanName("")
      setEditSatuanId(null)
      setEditNameError("")
      setShowEditDialog(false)

      fetchSatuans()

      showSuccess(
        "Berhasil mengubah data satuan", 
        "Data satuan telah diperbarui"
      )
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors
        if (errors.name) setEditNameError(errors.name[0])
      } else {
        setError(err.response?.data?.message || "Failed to update Satuan")
      }
      console.error("Error updating Satuan:", err)
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

      await api.post("/v1/app/units/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      setSelectedFile(null)
      setShowImportDialog(false)

      fetchSatuans()
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to import Satuans")
      console.error("Error importing Satuans:", err)
    }
  }

  const downloadTemplate = async () => {
    try {
      const response = await api.get("/v1/app/units/template", {
        responseType: "blob",
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "Satuan_template.xlsx")
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
    setNewSatuanName("")
    setNameError("")
    setShowAddDialog(true)
  }

  const handleOpenEditDialog = (Satuan: Satuan) => {
    setEditSatuanId(Satuan.id)
    setEditSatuanName(Satuan.name)
    setEditNameError("")
    setShowEditDialog(true)
  }

  const handleOpenImportDialog = () => {
    setSelectedFile(null)
    setShowImportDialog(true)
  }

  const allSelected = filteredSatuans.length > 0 && filteredSatuans.every((Satuan) => Satuan.selected)

  const anySelected = Satuans.some((Satuan) => Satuan.selected)

  const selectedSatuans = Satuans.filter((Satuan) => Satuan.selected)

  const getConfirmationMessage = () => {
    if (allSelected) {
      return "Apakah Anda yakin ingin menghapus yang terpilih?"
    } else if (selectedSatuans.length === 1) {
      return `Apakah Anda yakin ingin menghapus Satuan "${selectedSatuans[0].name}"?`
    } else {
      const SatuanNames = selectedSatuans.map((Satuan) => Satuan.name).join('", "')
      return `Apakah Anda yakin ingin menghapus Satuan "${SatuanNames}"?`
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
            <h2 className="text-xl font-semibold">Satuan</h2>
            <p className="text-sm text-gray-500">Master - Satuan</p>
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
                    <TableHead className="w-12 p-4">
                      <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                    </TableHead>
                    <TableHead className="w-12 p-4">No</TableHead>
                    <TableHead className="p-4">Nama</TableHead>
                    <TableHead className="w-24 p-4 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredSatuans.length > 0 ? (
                    filteredSatuans.map((Satuan, index) => (
                      <TableRow
                        key={Satuan.id}
                        className={index % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50/30 hover:bg-gray-50"}
                      >
                        <TableCell className="p-4 border-t border-gray-100">
                          <Checkbox checked={Satuan.selected} onCheckedChange={() => toggleSelectSatuan(Satuan.id)} />
                        </TableCell>
                        <TableCell className="p-4 border-t border-gray-100">
                          {paginationMeta
                            ? paginationMeta.per_page * (paginationMeta.current_page - 1) + index + 1
                            : index + 1}
                        </TableCell>
                        <TableCell className="p-4 border-t border-gray-100">{Satuan.name}</TableCell>
                        <TableCell className="p-4 border-t border-gray-100">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleOpenEditDialog(Satuan)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setSatuans(Satuans.map((b) => (b.id === Satuan.id ? { ...b, selected: true } : b)))
                                setFilteredSatuans(
                                  filteredSatuans.map((b) => (b.id === Satuan.id ? { ...b, selected: true } : b)),
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
                      <TableCell colSpan={4} className="h-24 text-center">
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
            <DialogTitle>Tambah Satuan</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="Satuan-name">Nama</Label>
                <Input
                  id="Satuan-name"
                  value={newSatuanName}
                  onChange={(e) => {
                    setNewSatuanName(e.target.value)
                    setNameError("")
                  }}
                  placeholder="Masukkan nama Satuan"
                />
                {nameError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{nameError}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button onClick={addSatuan} className="bg-green-600 hover:bg-green-700">
              Tambah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Satuan</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-Satuan-name">Nama</Label>
                <Input
                  id="edit-Satuan-name"
                  value={editSatuanName}
                  onChange={(e) => {
                    setEditSatuanName(e.target.value)
                    setEditNameError("")
                  }}
                  placeholder="Masukkan nama Satuan"
                />
                {editNameError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{editNameError}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button onClick={editSatuan} className="bg-green-600 hover:bg-green-700">
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

