"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Pencil, X, Search, Trash2, AlertCircle, Plus, Eye, Bell, ChevronDown, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sidebar } from "@/components/sidebar"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
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
import { CheckCircle } from "lucide-react"

// Update the Customer interface to match the API response
interface Customer {
  id: number
  code: string
  name: string
  phone: string
  email?: string
  address?: string
  notes?: string
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
  data: Array<Omit<Customer, "selected">>
  links?: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
  meta?: PaginationMeta
}

export default function CustomerPage() {
  const { userEmail, logout } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [perPage, setPerPage] = useState("10")
  const [currentPage, setCurrentPage] = useState(1)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [newCustomerName, setNewCustomerName] = useState("")
  const [newCustomerCode, setNewCustomerCode] = useState("")
  const [newCustomerPhone, setNewCustomerPhone] = useState("")
  const [editCustomerName, setEditCustomerName] = useState("")
  const [editCustomerCode, setEditCustomerCode] = useState("")
  const [editCustomerPhone, setEditCustomerPhone] = useState("")
  const [editCustomerId, setEditCustomerId] = useState<number | null>(null)
  const [nameError, setNameError] = useState("")
  const [codeError, setCodeError] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [editNameError, setEditNameError] = useState("")
  const [editCodeError, setEditCodeError] = useState("")
  const [editPhoneError, setEditPhoneError] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [newCustomerPhoto, setNewCustomerPhoto] = useState<File | null>(null)
  const [newCustomerEmail, setNewCustomerEmail] = useState("")
  const [photoError, setPhotoError] = useState("")
  const [emailError, setEmailError] = useState("")
  const [newCustomerAddress, setNewCustomerAddress] = useState("")
  const [newCustomerNotes, setNewCustomerNotes] = useState("")
  const [addressError, setAddressError] = useState("")
  const [notesError, setNotesError] = useState("")

  // Tambahkan state untuk foto, email, address, notes pada edit
  const [editCustomerPhoto, setEditCustomerPhoto] = useState<File | null>(null)
  const [editCustomerEmail, setEditCustomerEmail] = useState("")
  const [editCustomerAddress, setEditCustomerAddress] = useState("")
  const [editCustomerNotes, setEditCustomerNotes] = useState("")

  // Tambahkan state untuk pop up sukses
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // Fetch customers from API
  const fetchCustomers = async () => {
    setLoading(true)
    setError("")

    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "{}")
      const companyId = auth.companyId

      if (!companyId) {
        setError("Company ID not found. Please log in again.")
        return
      }

      const response = await api.get<ApiResponse>(`/v1/app/customers`, {
        params: {
          page: currentPage,
          size: perPage,
          search: searchQuery,
          company_id: companyId,
          sortBy: "",
        },
      })

      const customersWithSelection = response.data.data.map((customer) => ({
        ...customer,
        selected: false,
      }))

      setCustomers(customersWithSelection)
      setFilteredCustomers(customersWithSelection)

      if (response.data.meta) {
        setPaginationMeta(response.data.meta)
      }
    } catch (err: any) {
      console.error("Error fetching customers:", err)
      setError(err.response?.data?.message || "Failed to fetch customers")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomers()
  }, [currentPage, perPage, searchQuery])

  const toggleSelectAll = () => {
    const allSelected = filteredCustomers.every((customer) => customer.selected)
    setCustomers(
      customers.map((customer) => {
        if (filteredCustomers.some((fs) => fs.id === customer.id)) {
          return { ...customer, selected: !allSelected }
        }
        return customer
      }),
    )
    setFilteredCustomers(
      filteredCustomers.map((customer) => ({
        ...customer,
        selected: !allSelected,
      })),
    )
  }

  const toggleSelectCustomer = (id: number) => {
    setCustomers(
      customers.map((customer) => (customer.id === id ? { ...customer, selected: !customer.selected } : customer)),
    )
    setFilteredCustomers(
      filteredCustomers.map((customer) =>
        customer.id === id ? { ...customer, selected: !customer.selected } : customer,
      ),
    )
  }

  const deleteSelected = async () => {
    try {
      const selectedIds = customers.filter((customer) => customer.selected).map((customer) => customer.id)

      // Hapus data di backend lewat API
      for (const id of selectedIds) {
        await api.delete(`/v1/app/customers/${id}`)
      }

      // Setelah berhasil hapus di backend, fetch ulang data dari backend
      fetchCustomers()
      setShowDeleteDialog(false)
      setSuccessMessage("Pelanggan Berhasil Dihapus")
      setShowSuccessDialog(true)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete customers")
      console.error("Error deleting customers:", err)
    }
  }

  const addCustomer = async () => {
    try {
      let hasError = false
      if (!newCustomerName.trim()) {
        setNameError("Nama customer tidak boleh kosong")
        hasError = true
      }
      if (!newCustomerCode.trim()) {
        setCodeError("Kode customer tidak boleh kosong")
        hasError = true
      }
      if (!newCustomerPhone.trim()) {
        setPhoneError("Nomor HP tidak boleh kosong")
        hasError = true
      }
      // Hapus validasi wajib untuk address dan notes
      // if (!newCustomerAddress.trim()) {
      //   setAddressError("Alamat tidak boleh kosong")
      //   hasError = true
      // }
      // if (!newCustomerNotes.trim()) {
      //   setNotesError("Keterangan tidak boleh kosong")
      //   hasError = true
      // }

      if (hasError) return

      const auth = JSON.parse(localStorage.getItem("auth") || "{}")
      const companyId = auth.companyId
      const outletId = auth.outletId

      if (!companyId || !outletId) {
        setError("Company ID or Outlet ID not found. Please log in again.")
        return
      }

      const formData = new FormData()
      formData.append("company_id", companyId.toString())
      formData.append("outlet_id", outletId.toString())
      formData.append("code", newCustomerCode.trim())
      formData.append("name", newCustomerName.trim())
      formData.append("phone", newCustomerPhone.trim())

      if (newCustomerEmail) {
        formData.append("email", newCustomerEmail.trim())
      }
      if (newCustomerPhoto) {
        formData.append("photo", newCustomerPhoto)
      }
      if (newCustomerAddress) {
        formData.append("address", newCustomerAddress.trim())
      }
      if (newCustomerNotes) {
        formData.append("notes", newCustomerNotes.trim())
      }

      const response = await api.post("/v1/app/customers", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      if (response.status === 200 || response.status === 201) {
        setNewCustomerName("")
        setNewCustomerCode("")
        setNewCustomerPhone("")
        setNewCustomerEmail("")
        setNewCustomerPhoto(null)
        setNewCustomerAddress("")
        setNewCustomerNotes("")
        setShowAddDialog(false)

        fetchCustomers()

        setNameError("")
        setCodeError("")
        setPhoneError("")
        setEmailError("")
        setPhotoError("")
        setError("")
      }
    } catch (err: any) {
      console.error("Error adding customer:", err)
      if (err.response?.data?.errors) {
        const apiErrors = err.response.data.errors
        if (apiErrors.name) setNameError(apiErrors.name[0])
        if (apiErrors.code) setCodeError(apiErrors.code[0])
        if (apiErrors.phone) setPhoneError(apiErrors.phone[0])
        if (apiErrors.email) setEmailError(apiErrors.email[0])
        if (apiErrors.photo) setPhotoError(apiErrors.photo[0])
      } else {
        setError(err.response?.data?.message || "Failed to add customer")
      }
    }
  }

  const handleOpenAddDialog = () => {
    setNewCustomerName("")
    setNewCustomerCode("")
    setNewCustomerPhone("")
    setNameError("")
    setCodeError("")
    setPhoneError("")
    setShowAddDialog(true)
  }

  const handleOpenEditDialog = (customer: Customer) => {
    setEditCustomerId(customer.id)
    setEditCustomerName(customer.name)
    setEditCustomerCode(customer.code)
    setEditCustomerPhone(customer.phone)
    setEditCustomerEmail(customer.email || "")
    setEditCustomerAddress(customer.address || "")
    setEditCustomerNotes(customer.notes || "")
    setEditCustomerPhoto(null)
    setEditNameError("")
    setEditCodeError("")
    setEditPhoneError("")
    setShowEditDialog(true)
  }

  const editCustomer = async () => {
    let hasError = false

    if (!editCustomerName.trim()) {
      setEditNameError("Nama customer tidak boleh kosong")
      hasError = true
    }
    if (!editCustomerCode.trim()) {
      setEditCodeError("Kode customer tidak boleh kosong")
      hasError = true
    }
    if (hasError || !editCustomerId) return

    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "{}")
      const companyId = auth.companyId

      if (!companyId) {
        setError("Company ID not found. Please log in again.")
        return
      }

      const formData = new FormData()
      formData.append("company_id", companyId)
      formData.append("code", editCustomerCode.trim())
      formData.append("name", editCustomerName.trim())
      formData.append("phone", editCustomerPhone.trim())
      formData.append("email", editCustomerEmail.trim())
      formData.append("address", editCustomerAddress.trim())
      formData.append("notes", editCustomerNotes.trim())
      if (editCustomerPhoto) {
        formData.append("photo", editCustomerPhoto)
      }

      await api.post(`/v1/app/customers/${editCustomerId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      setEditCustomerName("")
      setEditCustomerCode("")
      setEditCustomerPhone("")
      setEditCustomerEmail("")
      setEditCustomerAddress("")
      setEditCustomerNotes("")
      setEditCustomerPhoto(null)
      setEditCustomerId(null)
      setEditNameError("")
      setEditCodeError("")
      setEditPhoneError("")
      setShowEditDialog(false)

      fetchCustomers()
      setSuccessMessage("Pelanggan Berhasil Diperbarui")
      setShowSuccessDialog(true)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update customer")
      console.error("Error updating customer:", err)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleImport = async () => {
    if (!selectedFile) {
      setError("No file selected.")
      return
    }

    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "{}")
      const companyId = auth.companyId

      if (!companyId) {
        setError("Company ID not found. Please log in again.")
        return
      }

      const formData = new FormData()
      formData.append("file", selectedFile)

      await api.post("/v1/app/customers/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      setSelectedFile(null)
      setShowImportDialog(false)
      fetchCustomers()
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to import customers")
      console.error("Error importing customers:", err)
    }
  }

  const downloadTemplate = async () => {
    try {
      const response = await api.get("/v1/app/customers/template", {
        responseType: "blob",
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "customer_template.xlsx")
      document.body.appendChild(link)
      link.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to download template")
      console.error("Error downloading template:", err)
    }
  }

  const handleViewCustomer = (customerId: number) => {
    router.push(`/master/pelanggan/${customerId}`)
  }

  const handleLogout = () => {
    logout()
    router.replace("/login")
  }

  const allSelected = filteredCustomers.length > 0 && filteredCustomers.every((customer) => customer.selected)
  const anySelected = customers.some((customer) => customer.selected)
  const selectedCustomers = customers.filter((customer) => customer.selected)

  const getConfirmationMessage = () => {
    if (allSelected) {
      return "Apakah Anda yakin ingin menghapus yang terpilih?"
    } else if (selectedCustomers.length === 1) {
      return `Apakah Anda yakin ingin menghapus customer "${selectedCustomers[0].name}"?`
    } else {
      const customerNames = selectedCustomers.map((customer) => customer.name).join('", "')
      return `Apakah Anda yakin ingin menghapus customer "${customerNames}"?`
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
      <div className="flex-1 w-full flex flex-col">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white px-4 md:px-6 py-4 shadow-sm gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-semibold">Pelanggan</h1>
            <p className="text-xs md:text-sm text-gray-500">Master - Pelanggan</p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{userEmail ? userEmail[0].toUpperCase() : "U"}</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline">{userEmail ? userEmail.split("@")[0] : "User"}</span>
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

        <main className="flex-1 p-2 md:p-6">
          <div className="mb-4">
            <h2 className="text-lg md:text-xl font-semibold">Pelanggan</h2>
            <p className="text-xs md:text-sm text-gray-500">Master - Pelanggan</p>
          </div>

          <div className="rounded-lg bg-white p-2 md:p-6 shadow-sm overflow-x-auto">
            <div className="mb-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2">
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

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search"
                    className="w-full sm:w-64 pl-9"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-1">
                      <ChevronDown className="h-4 w-4" />
                      Import Data
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={handleOpenEditDialog}>Import Data</DropdownMenuItem>
                    <DropdownMenuItem onClick={downloadTemplate}>Export Data</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {anySelected && (
                  <Button
                    variant="destructive"
                    className="flex items-center gap-1"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Hapus terpilih</span>
                    <span className="sm:hidden">Hapus</span>
                  </Button>
                )}

                <Button className="bg-green-600 hover:bg-green-700" onClick={handleOpenAddDialog}>
                  <Plus className="mr-1 h-4 w-4" />
                  <span className="hidden sm:inline">Buat Baru</span>
                  <span className="sm:hidden">Tambah</span>
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="overflow-x-auto">
              <Table className="min-w-[600px] md:min-w-0">
                <TableHeader className="bg-gray-50">
                  <TableRow className="hover:bg-gray-50">
                    <TableHead className="w-12 p-4">
                      <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                    </TableHead>
                    <TableHead className="p-4">Kode</TableHead>
                    <TableHead className="p-4">Nama</TableHead>
                    <TableHead className="p-4">No. HP</TableHead>
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
                  ) : filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer, index) => (
                      <TableRow
                        key={customer.id}
                        className={index % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50/30 hover:bg-gray-50"}
                      >
                        <TableCell className="p-4 border-t border-gray-100">
                          <Checkbox
                            checked={customer.selected}
                            onCheckedChange={() => toggleSelectCustomer(customer.id)}
                          />
                        </TableCell>
                        <TableCell className="p-4 border-t border-gray-100">{customer.code}</TableCell>
                        <TableCell className="p-4 border-t border-gray-100">{customer.name}</TableCell>
                        <TableCell className="p-4 border-t border-gray-100">{customer.phone}</TableCell>
                        <TableCell className="p-4 border-t border-gray-100">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleViewCustomer(customer.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleOpenEditDialog(customer)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setCustomers(
                                  customers.map((s) => (s.id === customer.id ? { ...s, selected: true } : s)),
                                )
                                setFilteredCustomers(
                                  filteredCustomers.map((s) => (s.id === customer.id ? { ...s, selected: true } : s)),
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

            {/* Pagination */}
            {paginationMeta && (
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="text-sm text-gray-500">
                  Page {paginationMeta.from} to {paginationMeta.to} of {paginationMeta.total} entries
                </div>
                <div className="flex items-center gap-1 flex-wrap">
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
                  {paginationMeta.last_page > 3 && (
                    <Button
                      variant={currentPage === 2 ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(2)}
                      className={currentPage === 2 ? "bg-blue-600 hover:bg-blue-700" : ""}
                    >
                      2
                    </Button>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="flex flex-col items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-center text-xl">Hapus</DialogTitle>
          </DialogHeader>
          <DialogDescription className="text-center py-2">{getConfirmationMessage()}</DialogDescription>
          <DialogFooter className="flex justify-center gap-2 sm:justify-center">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={deleteSelected}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Customer Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tambah Pelanggan</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              {/* Profile Photo Input */}
              <div className="space-y-2">
                <Label htmlFor="customer-photo">Foto Profil (Opsional)</Label>
                <div className="flex flex-col items-start gap-2">
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 flex items-center justify-center rounded-full bg-gray-200">
                      {newCustomerPhoto ? (
                        <img
                          src={URL.createObjectURL(newCustomerPhoto)}
                          alt="Preview"
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="12" fill="#e5e7eb"/>
                          <path d="M8 12a4 4 0 1 1 8 0 4 4 0 0 1-8 0Zm-2 6a6 6 0 0 1 12 0H6Z" fill="#9ca3af"/>
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex w-full items-center gap-2">
                    <label className="inline-block">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setNewCustomerPhoto(e.target.files[0])
                            setPhotoError("")
                          }
                        }}
                      />
                      <Button asChild variant="outline" size="sm">
                        <span>Choose File</span>
                      </Button>
                    </label>
                    <span className="text-sm text-gray-700">
                      {newCustomerPhoto ? newCustomerPhoto.name : "Tidak ada file dipilih"}
                    </span>
                  </div>
                </div>
                {photoError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{photoError}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer-code">Kode</Label>
                <Input
                  id="customer-code"
                  value={newCustomerCode}
                  onChange={(e) => {
                    setNewCustomerCode(e.target.value)
                    setCodeError("")
                  }}
                  placeholder="Masukkan kode pelanggan"
                />
                {codeError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{codeError}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer-name">Nama</Label>
                <Input
                  id="customer-name"
                  value={newCustomerName}
                  onChange={(e) => {
                    setNewCustomerName(e.target.value)
                    setNameError("")
                  }}
                  placeholder="Masukkan nama pelanggan"
                />
                {nameError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{nameError}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer-email">Email (Opsional)</Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={newCustomerEmail}
                  onChange={(e) => {
                    setNewCustomerEmail(e.target.value)
                    setEmailError("")
                  }}
                  placeholder="Masukkan email pelanggan"
                />
                {emailError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{emailError}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer-phone">No. HP</Label>
                <Input
                  id="customer-phone"
                  value={newCustomerPhone}
                  onChange={(e) => {
                    setNewCustomerPhone(e.target.value)
                    setPhoneError("")
                  }}
                  placeholder="Masukkan nomor HP pelanggan"
                />
                {phoneError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{phoneError}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer-address">Alamat</Label>
                <Input
                  id="customer-address"
                  value={newCustomerAddress}
                  onChange={(e) => {
                    setNewCustomerAddress(e.target.value)
                    setAddressError("")
                  }}
                  placeholder="Masukkan alamat pelanggan"
                />
                {addressError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{addressError}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer-notes">Keterangan</Label>
                <Input
                  id="customer-notes"
                  value={newCustomerNotes}
                  onChange={(e) => {
                    setNewCustomerNotes(e.target.value)
                    setNotesError("")
                  }}
                  placeholder="Masukkan keterangan pelanggan"
                />
                {notesError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{notesError}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button onClick={addCustomer} className="bg-green-600 hover:bg-green-700">
              Tambah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Pelanggan</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              {/* Profile Photo Input */}
              <div className="space-y-2">
                <Label htmlFor="edit-customer-photo">Foto Profil (Opsional)</Label>
                <div className="flex flex-col items-start gap-2">
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 flex items-center justify-center rounded-full bg-gray-200">
                      {editCustomerPhoto ? (
                        <img
                          src={URL.createObjectURL(editCustomerPhoto)}
                          alt="Preview"
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        // Ganti src berikut dengan icon/image default kamu jika ada
                        <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="12" fill="#e5e7eb"/>
                          <path d="M8 12a4 4 0 1 1 8 0 4 4 0 0 1-8 0Zm-2 6a6 6 0 0 1 12 0H6Z" fill="#9ca3af"/>
                        </svg>
                      )}
                    </div>
                  </div>
                  <div className="flex w-full items-center gap-2">
                    <label className="inline-block">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setEditCustomerPhoto(e.target.files[0])
                          }
                        }}
                      />
                      <Button asChild variant="outline" size="sm">
                        <span>Choose File</span>
                      </Button>
                    </label>
                    <span className="text-sm text-gray-700">
                      {editCustomerPhoto ? editCustomerPhoto.name : "Tidak ada file dipilih"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-customer-code">Kode</Label>
                <Input
                  id="edit-customer-code"
                  value={editCustomerCode}
                  onChange={(e) => {
                    setEditCustomerCode(e.target.value)
                    setEditCodeError("")
                  }}
                  placeholder="Masukkan kode pelanggan"
                />
                {editCodeError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{editCodeError}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-customer-name">Nama</Label>
                <Input
                  id="edit-customer-name"
                  value={editCustomerName}
                  onChange={(e) => {
                    setEditCustomerName(e.target.value)
                    setEditNameError("")
                  }}
                  placeholder="Masukkan nama pelanggan"
                />
                {editNameError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{editNameError}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-customer-email">Email</Label>
                <Input
                  id="edit-customer-email"
                  type="email"
                  value={editCustomerEmail}
                  onChange={(e) => setEditCustomerEmail(e.target.value)}
                  placeholder="Masukkan email pelanggan"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-customer-phone">No. HP</Label>
                <Input
                  id="edit-customer-phone"
                  value={editCustomerPhone}
                  onChange={(e) => {
                    setEditCustomerPhone(e.target.value)
                    setEditPhoneError("")
                  }}
                  placeholder="Masukkan nomor HP pelanggan"
                />
                {editPhoneError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{editPhoneError}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-customer-address">Alamat</Label>
                <Input
                  id="edit-customer-address"
                  value={editCustomerAddress}
                  onChange={(e) => setEditCustomerAddress(e.target.value)}
                  placeholder="Masukkan alamat pelanggan"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-customer-notes">Keterangan</Label>
                <Input
                  id="edit-customer-notes"
                  value={editCustomerNotes}
                  onChange={(e) => setEditCustomerNotes(e.target.value)}
                  placeholder="Masukkan keterangan pelanggan"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button onClick={editCustomer} className="bg-green-600 hover:bg-green-700">
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Data Dialog */}
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

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-xs text-center">
          <div className="flex flex-col items-center justify-center py-4">
            <CheckCircle className="h-12 w-12 text-green-600 mb-2" />
            <DialogTitle className="text-lg font-bold mt-2 mb-1">SUKSES</DialogTitle>
            <DialogDescription className="mb-4 text-gray-600">{successMessage}</DialogDescription>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700 text-white w-24 mx-auto"
              onClick={() => setShowSuccessDialog(false)}
            >
              Ok
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
