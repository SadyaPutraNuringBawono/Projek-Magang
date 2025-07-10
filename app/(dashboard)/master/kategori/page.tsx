"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Pencil, X, ChevronLeft, Search, Trash2, AlertCircle, Plus, Eye, Bell, ChevronDown, LogOut, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sidebar } from "@/components/sidebar"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
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
import { useSuccessNotification, SuccessNotification } from "@/components/success-notification"

interface Category {
  id: number
  code: string
  name: string
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
  data: Array<Omit<Category, "selected">>
  links?: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
  meta?: PaginationMeta
}

export default function CategoryPage() {
  const { userEmail, logout } = useAuth()
  const router = useRouter()
  const { notification, showSuccess, hideSuccess } = useSuccessNotification()
  const [searchQuery, setSearchQuery] = useState("")
  const [perPage, setPerPage] = useState("10")
  const [currentPage, setCurrentPage] = useState(1)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryCode, setNewCategoryCode] = useState("")
  const [editCategoryName, setEditCategoryName] = useState("")
  const [editCategoryCode, setEditCategoryCode] = useState("")
  const [editCategoryId, setEditCategoryId] = useState<number | null>(null)
  const [nameError, setNameError] = useState("")
  const [codeError, setCodeError] = useState("")
  const [editNameError, setEditNameError] = useState("")
  const [editCodeError, setEditCodeError] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])

  const fetchCategories = async () => {
    setLoading(true)
    setError("")

    try {
      const companyId = localStorage.getItem("companyId") || "1"
      const response = await api.get<ApiResponse>(`/v1/app/categories`, {
        params: {
          page: currentPage,
          size: perPage,
          search: searchQuery,
          company_id: companyId,
          sortBy: "",
        },
      })

      const categoriesWithSelection = response.data.data.map((category) => ({
        ...category,
        selected: false,
      }))

      setCategories(categoriesWithSelection)
      setFilteredCategories(categoriesWithSelection)

      if (response.data.meta) {
        setPaginationMeta(response.data.meta)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch categories")
      console.error("Error fetching categories:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [currentPage, perPage, searchQuery])

  const toggleSelectAll = () => {
    const allSelected = filteredCategories.every((category) => category.selected)
    setCategories(
      categories.map((category) => {
        if (filteredCategories.some((fc) => fc.id === category.id)) {
          return { ...category, selected: !allSelected }
        }
        return category
      }),
    )
    setFilteredCategories(
      filteredCategories.map((category) => ({
        ...category,
        selected: !allSelected,
      })),
    )
  }

  const toggleSelectCategory = (id: number) => {
    setCategories(
      categories.map((category) => (category.id === id ? { ...category, selected: !category.selected } : category)),
    )
    setFilteredCategories(
      filteredCategories.map((category) =>
        category.id === id ? { ...category, selected: !category.selected } : category,
      ),
    )
  }

  const deleteSelected = async () => {
    try {
      const selectedIds = categories.filter((category) => category.selected).map((category) => category.id)

      for (const id of selectedIds) {
        await api.delete(`/v1/app/categories/${id}`)
      }

      fetchCategories()
      setShowDeleteDialog(false)

      showSuccess(
        "Berhasil menghapus data kategori", 
        "Data kategori telah dihapus"
      )
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete categories")
      console.error("Error deleting categories:", err)
    }
  }

  const addCategory = async () => {
    let hasError = false

    if (!newCategoryName.trim()) {
      setNameError("Nama kategori tidak boleh kosong")
      hasError = true
    }

    if (!newCategoryCode.trim()) {
      setCodeError("Kode kategori tidak boleh kosong")
      hasError = true
    }

    if (hasError) return

    try {
      const companyId = localStorage.getItem("companyId") || "1"

      await api.post("/v1/app/categories", {
        company_id: Number.parseInt(companyId),
        code: newCategoryCode.trim(),
        name: newCategoryName.trim(),
      })

      setNewCategoryName("")
      setNewCategoryCode("")
      setNameError("")
      setCodeError("")
      setShowAddDialog(false)

      fetchCategories()

      showSuccess(
        "Berhasil menambahkan kategori",
        "Data kategori baru telah ditambahkan",
      )
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors
        if (errors.name) setNameError(errors.name[0])
        if (errors.code) setCodeError(errors.code[0])
      } else {
        setError(err.response?.data?.message || "Failed to add category")
      }
      console.error("Error adding category:", err)
    }
  }

  const editCategory = async () => {
    let hasError = false

    if (!editCategoryName.trim()) {
      setEditNameError("Nama kategori tidak boleh kosong")
      hasError = true
    }

    if (!editCategoryCode.trim()) {
      setEditCodeError("Kode kategori tidak boleh kosong")
      hasError = true
    }

    if (hasError || !editCategoryId) return

    try {
      const companyId = localStorage.getItem("companyId") || "1"

      await api.post(`/v1/app/categories/${editCategoryId}`, {
        company_id: Number.parseInt(companyId),
        code: editCategoryCode.trim(),
        name: editCategoryName.trim(),
      })

      setEditCategoryName("")
      setEditCategoryCode("")
      setEditCategoryId(null)
      setEditNameError("")
      setEditCodeError("")
      setShowEditDialog(false)

      fetchCategories()

      showSuccess(
        "Berhasil mengubah data kategori", 
        "Data kategori telah diperbarui"
      )
    } catch (err: any) {
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors
        if (errors.name) setEditNameError(errors.name[0])
        if (errors.code) setEditCodeError(errors.code[0])
      } else {
        setError(err.response?.data?.message || "Failed to update category")
      }
      console.error("Error updating category:", err)
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

      await api.post("/v1/app/categories/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      setSelectedFile(null)
      setShowImportDialog(false)

      fetchCategories()
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to import categories")
      console.error("Error importing categories:", err)
    }
  }

  const downloadTemplate = async () => {
    try {
      const response = await api.get("/v1/app/categories/template", {
        responseType: "blob",
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "category_template.xlsx")
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
    setNewCategoryName("")
    setNewCategoryCode("")
    setNameError("")
    setCodeError("")
    setShowAddDialog(true)
  }

  const handleOpenEditDialog = (category: Category) => {
    setEditCategoryId(category.id)
    setEditCategoryName(category.name)
    setEditCategoryCode(category.code)
    setEditNameError("")
    setEditCodeError("")
    setShowEditDialog(true)
  }

  const handleViewCategory = (categoryId: number) => {
    router.push(`/master/kategori/${categoryId}`)
  }

  const handleOpenImportDialog = () => {
    setSelectedFile(null)
    setShowImportDialog(true)
  }

  const handleLogout = () => {
    logout()
    router.replace("/login")
  }

  const allSelected = filteredCategories.length > 0 && filteredCategories.every((category) => category.selected)

  const anySelected = categories.some((category) => category.selected)

  const selectedCategories = categories.filter((category) => category.selected)

  const getConfirmationMessage = () => {
    if (allSelected) {
      return "Apakah Anda yakin ingin menghapus semua?";
    } else if (selectedCategories.length > 3) {
      return "Apakah Anda yakin ingin menghapus yang terpilih?";
    } else if (selectedCategories.length === 1) {
      return `Apakah Anda yakin ingin menghapus brand "${selectedCategories[0].name}"?`;
    } else {
      const brandNames = selectedCategories.map((category) => category.name).join('", "');
      return `Apakah Anda yakin ingin menghapus brand "${brandNames}"?`;
    }
  }

  const handlePageChange = (page: number) => {
    if (paginationMeta && page > 0 && page <= paginationMeta.last_page) {
      setCurrentPage(page)
    }
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

        <main className="p-4 lg:p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Kategori</h2>
            <p className="text-sm text-gray-500">Master - Kategori</p>
          </div>

          <div className="rounded-lg bg-white p-4 lg:p-6 shadow-sm">
            {/* Mobile-first action buttons */}
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
                      className="bg-green-600 hover:bg-green-700 flex items-center gap-1 flex-1 sm:flex-none"
                      onClick={handleOpenAddDialog}
                    >
                      <Plus className="h-4 w-4" />
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
                    <TableHead className="p-4">Kode</TableHead>
                    <TableHead className="p-4">Nama</TableHead>
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
                  ) : filteredCategories.length > 0 ? (
                    filteredCategories.map((category, index) => (
                      <TableRow
                        key={category.id}
                        className={index % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50/30 hover:bg-gray-50"}
                      >
                        <TableCell className="p-4 border-t border-gray-100">
                          <Checkbox
                            checked={category.selected}
                            onCheckedChange={() => toggleSelectCategory(category.id)}
                          />
                        </TableCell>
                        <TableCell className="p-4 border-t border-gray-100">
                          {paginationMeta
                            ? paginationMeta.per_page * (paginationMeta.current_page - 1) + index + 1
                            : index + 1}
                        </TableCell>
                        <TableCell className="p-4 border-t border-gray-100">{category.code}</TableCell>
                        <TableCell className="p-4 border-t border-gray-100">{category.name}</TableCell>
                        <TableCell className="p-4 border-t border-gray-100">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleViewCategory(category.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleOpenEditDialog(category)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setCategories(
                                  categories.map((c) => (c.id === category.id ? { ...c, selected: true } : c)),
                                )
                                setFilteredCategories(
                                  filteredCategories.map((c) => (c.id === category.id ? { ...c, selected: true } : c)),
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
        <DialogContent className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[calc(100%-2rem)] sm:w-full max-w-md rounded-lg bg-white p-4 shadow-lg sm:p-6">
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
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-4 sm:p-6 shadow-lg">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-base sm:text-lg font-semibold">Tambah Kategori</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category-code">Kode</Label>
                <Input
                  id="category-code"
                  value={newCategoryCode}
                  onChange={(e) => {
                    setNewCategoryCode(e.target.value)
                    setCodeError("")
                  }}
                  placeholder="Masukkan kode kategori"
                  className="w-full"
                />
                {codeError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{codeError}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category-name">Nama</Label>
                <Input
                  id="category-name"
                  value={newCategoryName}
                  onChange={(e) => {
                    setNewCategoryName(e.target.value)
                    setNameError("")
                  }}
                  placeholder="Masukkan nama kategori"
                  className="w-full"
                />
                {nameError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{nameError}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="w-full sm:w-auto">
              Batal
            </Button>
            <Button onClick={addCategory} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
              Tambah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-4 sm:p-6 shadow-lg">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-base sm:text-lg font-semibold">Edit Kategori</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category-code">Kode</Label>
                <Input
                  id="edit-category-code"
                  value={editCategoryCode}
                  onChange={(e) => {
                    setEditCategoryCode(e.target.value)
                    setEditCodeError("")
                  }}
                  placeholder="Masukkan kode kategori"
                  className="w-full"
                />
                {editCodeError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{editCodeError}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-category-name">Nama</Label>
                <Input
                  id="edit-category-name"
                  value={editCategoryName}
                  onChange={(e) => {
                    setEditCategoryName(e.target.value)
                    setEditNameError("")
                  }}
                  placeholder="Masukkan nama kategori"
                  className="w-full"
                />
                {editNameError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{editNameError}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="w-full sm:w-auto">
              Batal
            </Button>
            <Button onClick={editCategory} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-4 sm:p-6 shadow-lg">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-base sm:text-lg font-semibold">Import Data</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <p className="text-sm mb-2">
                  Unduh{" "}
                  <Button
                    variant="link"
                    className="px-0 h-auto text-blue-600 hover:underline text-sm"
                    onClick={downloadTemplate}
                  >
                    Template
                  </Button>
                </p>
              </div>

              <div>
                <p className="text-sm mb-2">Pilih File</p>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer rounded-md border bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200 w-full sm:w-auto text-center"
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
                  <span className="text-sm text-gray-500 truncate w-full">
                    {selectedFile ? selectedFile.name : "Tidak Ada File Yang Dipilih"}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowImportDialog(false)} 
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button 
              onClick={handleImport} 
              disabled={!selectedFile}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
            >
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

