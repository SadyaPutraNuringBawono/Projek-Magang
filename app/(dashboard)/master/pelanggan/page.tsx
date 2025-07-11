"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Pencil, X, Search, Trash2, AlertCircle, Plus, Eye, Bell, ChevronDown, LogOut, Menu } from "lucide-react"
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
import { useSuccessNotification, SuccessNotification } from "@/components/success-notification"

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

export default function CustomerPage(): React.JSX.Element {
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
      setError(err.response?.data?.message || "Failed to fetch customers")
    } finally {
      setLoading(false)
    }
  }

  // Fetch all customers for the import dialog
  const fetchAllCustomers = async () => {
    const auth = JSON.parse(localStorage.getItem("auth") || "{}")
    const companyId = auth.companyId || 3
    const response = await api.get(`${process.env.BASE_URL}/v1/app/customers/all`, {
      params: { company_id: companyId }
    })
    // ...proses data...
  }

  // Fetch customer detail
  const fetchCustomerDetail = async (id: number) => {
    const response = await api.get(`/v1/app/customers/${id}`)
    // ...proses data...
  }

  useEffect(() => {
    fetchCustomers()
  }, [currentPage, perPage, searchQuery])

  // Function to toggle selection of all customers
  const toggleSelectAll = () => {
    const allSelected = filteredCustomers.every((customer) => customer.selected)
    setCustomers(
      customers.map((customer) => {
        // Only toggle customers that are in the filtered list
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

  // Function to toggle selection of a single customer
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

  // Function to delete selected customers
  const deleteSelected = async () => {
    try {
      const selectedIds = customers.filter((customer) => customer.selected).map((customer) => customer.id)

      // Hapus blok development, selalu gunakan API
      for (const id of selectedIds) {
        await api.delete(`/v1/app/customers/${id}`)
      }

      // Refresh the customers list
      fetchCustomers()
      setShowDeleteDialog(false)

      // Show success notification
      showSuccess(
        "Berhasil menghapus data pelanggan", 
        "Data pelanggan telah dihapus"
      )
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete customers")
      console.error("Error deleting customers:", err)
    }
  }

  // Function to add a new customer
  const addCustomer = async () => {
    try {
      // Validate required fields
      let hasError = false
      if (!newCustomerName.trim()) {
        setNameError("Nama pelanggan tidak boleh kosong")
        hasError = true
      }
      if (!newCustomerCode.trim()) {
        setCodeError("Kode pelanggan tidak boleh kosong")
        hasError = true
      }
      if (!newCustomerPhone.trim()) {
        setPhoneError("Nomor HP tidak boleh kosong")
        hasError = true
      }
      if (!newCustomerAddress.trim()) {
        setAddressError("Alamat tidak boleh kosong")
        hasError = true
      }
      if (!newCustomerNotes.trim()) {
        setNotesError("Keterangan tidak boleh kosong")
        hasError = true
      }

      if (hasError) return

      const auth = JSON.parse(localStorage.getItem("auth") || "{}")
      const companyId = auth.companyId
      const outletId = auth.outletId // Ambil outlet_id dari auth

      if (!companyId || !outletId) {
        setError("Company ID or Outlet ID not found. Please log in again.")
        return
      }

      // Create FormData object
      const formData = new FormData()
      formData.append("company_id", companyId.toString())
      formData.append("outlet_id", outletId.toString()) // Tambahkan outlet_id
      formData.append("code", newCustomerCode.trim())
      formData.append("name", newCustomerName.trim())
      formData.append("phone", newCustomerPhone.trim())
      
      // Optional fields
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

      // Log data untuk debugging
      console.log("Sending data:", {
        company_id: companyId,
        outlet_id: outletId,
        code: newCustomerCode,
        name: newCustomerName,
        phone: newCustomerPhone,
        email: newCustomerEmail,
        address: newCustomerAddress,
        notes: newCustomerNotes,
        hasPhoto: !!newCustomerPhoto
      })

      // Make API request
      const response = await api.post("/v1/app/customers", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })

      // Check response
      if (response.status === 200 || response.status === 201) {
        // Reset form
        setNewCustomerName("")
        setNewCustomerCode("")
        setNewCustomerPhone("")
        setNewCustomerEmail("")
        setNewCustomerPhoto(null)
        setNewCustomerAddress("")
        setNewCustomerNotes("")
        setShowAddDialog(false)

        // Refresh customer list
        fetchCustomers()

        // Clear any existing errors
        setNameError("")
        setCodeError("")
        setPhoneError("")
        setEmailError("")
        setPhotoError("")
        setError("")

        // Show success notification
        showSuccess(
          "Berhasil menambahkan data pelanggan", 
          "Data pelanggan baru telah ditambahkan"
        )
      }
    } catch (err: any) {
      console.error("Error adding customer:", err)
      console.error("Error response:", err.response?.data)

      // Handle validation errors
      if (err.response?.data?.errors) {
        const apiErrors = err.response.data.errors
        
        // Set specific field errors
        if (apiErrors.name) setNameError(apiErrors.name[0])
        if (apiErrors.code) setCodeError(apiErrors.code[0])
        if (apiErrors.phone) setPhoneError(apiErrors.phone[0])
        if (apiErrors.email) setEmailError(apiErrors.email[0])
        if (apiErrors.photo) setPhotoError(apiErrors.photo[0])
      } else {
        // Set general error message
        setError(err.response?.data?.message || "Failed to add customer")
      }
    }
  }

  // Function to edit a customer
  const editCustomer = async () => {
    // Validate customer name, code, and phone
    let hasError = false

    if (!editCustomerName.trim()) {
      setEditNameError("Nama pelanggan tidak boleh kosong")
      hasError = true
    }

    if (!editCustomerCode.trim()) {
      setEditCodeError("Kode pelanggan tidak boleh kosong")
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

      await api.post(`/v1/app/customers/${editCustomerId}`, {
        company_id: companyId,
        code: editCustomerCode.trim(),
        name: editCustomerName.trim(),
        phone: editCustomerPhone.trim(),
      })

      // Reset form and close dialog
      setEditCustomerName("")
      setEditCustomerCode("")
      setEditCustomerPhone("")
      setEditCustomerId(null)
      setEditNameError("")
      setEditCodeError("")
      setEditPhoneError("")
      setShowEditDialog(false)

      // Refresh the customers list
      fetchCustomers()

      // Show success notification
      showSuccess(
        "Berhasil mengubah data pelanggan", 
        "Data pelanggan telah diperbarui"
      )
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update customer")
      console.error("Error updating customer:", err)
    }
  }

  // Function to handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
    }
  }

  // Function to handle import
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
        headers: { "Content-Type": "multipart/form-data" }
      })

      // Reset form and close dialog
      setSelectedFile(null)
      setShowImportDialog(false)

      // Refresh the customers list
      fetchCustomers()
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to import customers")
      console.error("Error importing customers:", err)
    }
  }

  // Function to download template
  const downloadTemplate = async () => {
    try {
      const response = await api.get("/v1/app/customers/template", {
        responseType: "blob",
      })

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "customer_template.xlsx")
      document.body.appendChild(link)
      link.click()

      // Clean up
      window.URL.revokeObjectURL(url)
      document.body.removeChild(link)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to download template")
      console.error("Error downloading template:", err)
    }
  }

  // Handle opening the add dialog
  const handleOpenAddDialog = () => {
    setNewCustomerName("")
    setNewCustomerCode("")
    setNewCustomerPhone("")
    setNameError("")
    setCodeError("")
    setPhoneError("")
    setShowAddDialog(true)
  }

  // Handle opening the edit dialog
  const handleOpenEditDialog = (customer: Customer) => {
    setEditCustomerId(customer.id)
    setEditCustomerName(customer.name)
    setEditCustomerCode(customer.code)
    setEditCustomerPhone(customer.phone)
    setEditNameError("")
    setEditCodeError("")
    setEditPhoneError("")
    setShowEditDialog(true)
  }

  // Handle viewing customer details
  const handleViewCustomer = (customerId: number) => {
    router.push(`/master/pelanggan/${customerId}`)
  }

  // Handle opening the import dialog
  const handleOpenImportDialog = () => {
    setSelectedFile(null)
    setShowImportDialog(true)
  }

  // Handle logout
  const handleLogout = () => {
    logout()
    router.replace("/login")
  }

  // Check if all filtered customers are selected
  const allSelected = filteredCustomers.length > 0 && filteredCustomers.every((customer) => customer.selected)

  // Check if any customer is selected
  const anySelected = customers.some((customer) => customer.selected)

  // Get selected customers
  const selectedCustomers = customers.filter((customer) => customer.selected)

  // Get confirmation message based on selection
  const getConfirmationMessage = () => {
    if (allSelected) {
      return "Apakah Anda yakin ingin menghapus yang terpilih?"
    } else if (selectedCustomers.length === 1) {
      return `Apakah Anda yakin ingin menghapus pelanggan "${selectedCustomers[0].name}"?`
    } else {
      const customerNames = selectedCustomers.map((customer) => customer.name).join('", "')
      return `Apakah Anda yakin ingin menghapus pelanggan "${customerNames}"?`
    }
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    if (paginationMeta && page > 0 && page <= paginationMeta.last_page) {
      setCurrentPage(page)
    }
  }

  const [sidebarOpen, setSidebarOpen] = useState(false)

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
            <h1 className="text-xl font-semibold hidden sm:block">Pelanggan</h1>
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
            <h2 className="text-xl font-semibold">Pelanggan</h2>
            <p className="text-sm text-gray-500">Master - Pelanggan</p>
          </div>

          <div className="rounded-lg bg-white p-4 lg:p-6 shadow-sm">
            {/* Action buttons - Mobile responsive */}
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="flex items-center gap-1 flex-1 sm:flex-none"
                        >
                          <span className="hidden sm:inline">Import Data</span>
                          <span className="sm:hidden">Import</span>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleOpenImportDialog}>Import Data</DropdownMenuItem>
                        <DropdownMenuItem onClick={downloadTemplate}>Export Template</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

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
                    <TableHead className="p-4">Kode</TableHead>
                    <TableHead className="p-4">Nama</TableHead>
                    <TableHead className="p-4">No. HP</TableHead>
                    <TableHead className="p-4">Email</TableHead>
                    <TableHead className="p-4">Alamat</TableHead>
                    <TableHead className="w-24 p-4 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
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
                        <TableCell className="p-4 border-t border-gray-100">{customer.email}</TableCell>
                        <TableCell className="p-4 border-t border-gray-100">{customer.address}</TableCell>
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
                      <TableCell colSpan={7} className="h-24 text-center">
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
                  Page {paginationMeta.from} to {paginationMeta.to} of {paginationMeta.total} entries
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

      {/* Add Customer Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-4 sm:p-6 shadow-lg">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-base sm:text-lg font-semibold">Tambah Pelanggan</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              {/* Profile Photo Input */}
              <div className="space-y-2">
                <Label htmlFor="customer-photo">Foto Profil (Opsional)</Label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {newCustomerPhoto && (
                    <div className="relative h-20 w-20">
                      <img
                        src={URL.createObjectURL(newCustomerPhoto)}
                        alt="Preview"
                        className="h-full w-full rounded-full object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -right-2 -top-2 h-6 w-6"
                        onClick={() => setNewCustomerPhoto(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <label className="cursor-pointer rounded-md border bg-gray-100 px-4 py-2 text-sm hover:bg-gray-200 w-full sm:w-auto text-center">
                    Pilih Foto
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
                  </label>
                </div>
                {photoError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{photoError}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Other form fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="w-full"
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
                    className="w-full"
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
                    className="w-full"
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
                    className="w-full"
                  />
                  {phoneError && (
                    <Alert variant="destructive" className="py-2 mt-2">
                      <AlertDescription className="text-sm">{phoneError}</AlertDescription>
                    </Alert>
                  )}
                </div>
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
                  className="w-full"
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
                  className="w-full"
                />
                {notesError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{notesError}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="w-full sm:w-auto">
              Batal
            </Button>
            <Button onClick={addCustomer} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
              Tambah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-4 sm:p-6 shadow-lg">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-base sm:text-lg font-semibold">Edit Pelanggan</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
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
                  className="w-full"
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
                  className="w-full"
                />
                {editNameError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{editNameError}</AlertDescription>
                  </Alert>
                )}
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
                  className="w-full"
                />
                {editPhoneError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{editPhoneError}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="w-full sm:w-auto">
              Batal
            </Button>
            <Button onClick={editCustomer} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Data Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md max-h-[90vh] overflow-y-auto fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-4 sm:p-6 shadow-lg">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-base sm:text-lg font-semibold">Import Data</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
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

      {/* Success Notification - Add this near the end */}
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
