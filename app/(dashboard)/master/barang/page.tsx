"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Pencil, X, ChevronLeft, Search, Trash2, AlertCircle, Plus, Eye, Bell, ChevronDown, LogOut, Menu } from "lucide-react"
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

interface Product {
  status: string
  id: number
  outlet_id: number
  code: string
  barcode?: string
  name: string
  category_id: number
  brand_id: number
  unit_id: number
  purchase_price: number
  selling_price: number
  photo?: string
  stock: number // Remove optional flag
  discount?: number
  rack_location?: string
  description?: string
  selected: boolean
  category?: {
    id: number;
    name: string;
  } | null;
  brand?: {
    id: number;
    name: string;
  } | null;
  unit?: {
    id: number;
    name: string;
  } | null;
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
  data: Array<Omit<Product, "selected">>
  links?: {
    first: string
    last: string
    prev: string | null
    next: string | null
  }
  meta?: PaginationMeta
}

// 1. Pastikan interface untuk kategori sudah benar
interface Category {
  id: number
  name: string
}

interface Brand {
  id: number
  name: string
}

interface Unit {
  id: number
  name: string
}

const Page = () => {
  const router = useRouter()
  const auth = useAuth()
  const { notification, showSuccess, hideSuccess } = useSuccessNotification()
  const [perPage, setPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [newProductData, setNewProductData] = useState({
    code: "",
    barcode: "", // Add barcode field
    name: "",
    category_id: "",
    brand_id: "",
    unit_id: "",
    purchase_price: "",
    selling_price: "",
    status: "1", // Tambahkan default status "1"
    stock: "0", // Set default value to "0"
    discount: "",
    rack_location: "",
    description: "", // Change notes to description
  })
  const [editProductData, setEditProductData] = useState({
    id: null as number | null,
    code: "",
    barcode: "",
    name: "",
    category_id: "",
    brand_id: "",
    unit_id: "",
    purchase_price: "",
    selling_price: "",
    status: "1",
    stock: "",
    discount: "",
    rack_location: "",
    description: "",
  })
  const [newProductFile, setNewProductFile] = useState<File | null>(null)
  const [editProductFile, setEditProductFile] = useState<File | null>(null)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [companyId, setCompanyId] = useState("1")
  const [newSupplierPhoto, setNewSupplierPhoto] = useState<File | null>(null)
  const [newSupplierEmail, setNewSupplierEmail] = useState("")
  const [photoError, setPhotoError] = useState("")
  const [emailError, setEmailError] = useState("")  
  const [newProductPhoto, setNewProductPhoto] = useState<File | null>(null)
  const [editProductPhoto, setEditProductPhoto] = useState<File | null>(null)
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([])
  const [brands, setBrands] = useState<Array<{ id: number; name: string }>>([])
  const [units, setUnits] = useState<Array<{ id: number; name: string }>>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [discountError, setDiscountError] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCompanyId = localStorage.getItem("companyId") || "1" // Fallback ke "1"
      setCompanyId(savedCompanyId)
    }
  }, [])

  // Fetch products from API
  const fetchProducts = async () => {
    setLoading(true)
    setError("")

    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "{}")
      const companyId = auth.companyId || "1"
      const response = await api.get<ApiResponse>(`/v1/app/products`, {
        params: {
          page: currentPage,
          size: perPage,
          search: searchQuery,
          company_id: companyId,
          sortBy: "",
        },
      })

      // Map the API response to include selected property
      const productsWithSelection = response.data.data.map((product) => ({
        ...product,
        selected: false,
      }))

      setProducts(productsWithSelection)
      setFilteredProducts(productsWithSelection)

      if (response.data.meta) {
        setPaginationMeta(response.data.meta)
      }
    } catch (err: any) {
      console.error("Error fetching products:", err)
      setError(err.response?.data?.message || "Failed to fetch products")
    } finally {
      setLoading(false)
    }
  }

  // Fetch products when page, perPage, or searchQuery changes
  useEffect(() => {
    fetchProducts()
  }, [currentPage, perPage, searchQuery])

  // Fetch categories, brands, and units
  const fetchCategories = async () => {
    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "{}")
      const companyId = auth.companyId
      
      const response = await api.get("/v1/app/categories", {
        params: {
          company_id: companyId
        }
      })

      // Log response untuk debugging
      console.log("Categories response:", response.data)

      if (response.data.data) {
        setCategories(response.data.data)
      }
    } catch (err) {
      console.error("Error fetching categories:", err)
    }
  }

  // 1. First, let's modify the fetchBrands function
  const fetchBrands = async () => {
    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "{}")
      const companyId = auth.companyId
      
      const response = await api.get("/v1/app/brands", {
        params: {
          company_id: companyId,
          size: 100
        }
      })

      console.log("Brands API Response:", response.data) // Debug log

      // Make sure we're accessing the correct data structure
      if (response.data && response.data.data) {
        setBrands(response.data.data)
      }
    } catch (err) {
      console.error("Error fetching brands:", err)
    }
  }

  // 2. Similarly for fetchUnits
  const fetchUnits = async () => {
    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "{}")
      const companyId = auth.companyId
      
      const response = await api.get("/v1/app/units", {
        params: {
          company_id: companyId,
          size: 100
        }
      })

      console.log("Units API Response:", response.data) // Debug log

      // Make sure we're accessing the correct data structure
      if (response.data && response.data.data) {
        setUnits(response.data.data)
      }
    } catch (err) {
      console.error("Error fetching units:", err)
    }
  }

  // Fetch categories, brands, and units on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Starting data fetch...")
        await Promise.all([fetchCategories(), fetchBrands(), fetchUnits()])
        console.log("Current states after fetch:")
        console.log("Brands:", brands)
        console.log("Units:", units)
      } catch (err) {
        console.error("Error in data fetching:", err)
      }
    }
    fetchData()
  }, []) // Empty dependency array to run only once on mount

  // 1. Hapus useEffect yang redundant, gunakan satu useEffect saja
  useEffect(() => {
    const fetchData = async () => {
      try {
        const auth = JSON.parse(localStorage.getItem("auth") || "{}")
        const companyId = auth.companyId

        // Fetch all data in parallel
        const [categoriesRes, unitsRes] = await Promise.all([
          api.get("/v1/app/categories", {
            params: {
              company_id: companyId,
              size: 100
            }
          }),
          api.get("/v1/app/units", {
            params: {
              company_id: companyId,
              size: 100
            }
          })
        ])

        console.log("Categories response:", categoriesRes.data)
        console.log("Units response:", unitsRes.data)

        if (categoriesRes.data?.data) {
          setCategories(categoriesRes.data.data)
        }
        if (unitsRes.data?.data) {
          setUnits(unitsRes.data.data)
        }
      } catch (err) {
        console.error("Error fetching data:", err)
      }
    }

    fetchData()
  }, []) // Empty dependency array to run only once on mount

  // Function to toggle selection of all products
  const toggleSelectAll = () => {
    const allSelected = filteredProducts.every((product) => product.selected)
    setProducts(
      products.map((product) => {
        // Only toggle products that are in the filtered list
        if (filteredProducts.some((fp) => fp.id === product.id)) {
          return { ...product, selected: !allSelected }
        }
        return product
      }),
    )
    setFilteredProducts(
      filteredProducts.map((product) => ({
        ...product,
        selected: !allSelected,
      })),
    )
  }

  // Function to toggle selection of a single product
  const toggleSelectProduct = (id: number) => {
    setProducts(products.map((product) => (product.id === id ? { ...product, selected: !product.selected } : product)))
    setFilteredProducts(
      filteredProducts.map((product) => (product.id === id ? { ...product, selected: !product.selected } : product)),
    )
  }

  // Function to delete selected products
  const deleteSelected = async () => {
    try {
      const selectedIds = products.filter((product) => product.selected).map((product) => product.id)

      if (selectedIds.length === 1) {
        // Delete single product
        await api.delete(`/v1/app/products/${selectedIds[0]}`)
      } else if (selectedIds.length > 1) {
        // Delete multiple products
        await api.delete("/v1/app/products", {
          data: { ids: selectedIds },
        })
      }

      // Refresh the products list
      fetchProducts()
      setShowDeleteDialog(false)

      showSuccess(
        "Berhasil menghapus data", 
        "Data barang telah dihapus"
      )
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to delete products")
      console.error("Error deleting products:", err)
    }
  }

  // Function to handle input change for new product
  const handleNewProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewProductData({
      ...newProductData,
      [name]: value,
    })
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: "",
      })
    }
  }

  // Update the handleEditProductChange function
  const handleEditProductChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditProductData(prev => ({
      ...prev,
      [name]: value
    }))

    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ""
      }))
    }
  }

  // Add handleEditPriceChange function
  const handleEditPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const formattedValue = formatNumber(value)
    
    setEditProductData(prev => ({
      ...prev,
      [name === 'harga_beli' ? 'purchase_price' : 'selling_price']: unformatNumber(formattedValue)
    }))

    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ""
      })
    }
  }

  // 1. Tambahkan fungsi untuk memformat angka dengan pemisah ribuan
  const formatNumber = (value: string) => {
    // Hapus semua karakter non-digit
    const number = value.replace(/\D/g, '')
    // Format dengan pemisah ribuan
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  // 2. Tambahkan fungsi untuk menghapus pemisah ribuan
  const unformatNumber = (value: string) => {
    return value.replace(/\./g, '')
  }

  // 3. Update handler untuk input harga
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const formattedValue = formatNumber(value)
    
    setNewProductData(prev => ({
      ...prev,
      [name]: unformatNumber(formattedValue) // Simpan nilai tanpa pemisah ke state
    }))

    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ""
      })
    }
  }

  // Function to add a new product
  const addProduct = async () => {
    // Reset error state terlebih dahulu
    setFormErrors({})

    // Validasi form sebelum submit
    const errors: Record<string, string> = {}
    
    // Tambahkan console.log untuk debugging
    console.log("Validating product data:", {
      code: newProductData.code,
      name: newProductData.name,
      category_id: newProductData.category_id,
      brand_id: newProductData.brand_id,
      unit_id: newProductData.unit_id,
      purchase_price: newProductData.purchase_price,
      selling_price: newProductData.selling_price,
    })

    // Perbaiki validasi dengan pemeriksaan yang lebih ketat
    if (!newProductData.code || newProductData.code.trim() === "") {
      errors.code = "Kode produk wajib diisi"
    }
    if (!newProductData.name || newProductData.name.trim() === "") {
      errors.name = "Nama produk wajib diisi"
    }
    if (!newProductData.category_id) {
      errors.category_id = "Kategori wajib diisi"
    }
    if (!newProductData.brand_id) {
      errors.brand_id = "Brand wajib diisi"
    }
    if (!newProductData.unit_id) {
      errors.unit_id = "Satuan wajib diisi"
    }
    if (!newProductData.purchase_price || newProductData.purchase_price === "0") {
      errors.purchase_price = "Harga beli wajib diisi"
    }
    if (!newProductData.selling_price || newProductData.selling_price === "0") {
      errors.selling_price = "Harga jual wajib diisi"
    }

    // Log error untuk debugging
    console.log("Validation errors:", errors)

    // Jika ada error, tampilkan dan stop eksekusi
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
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
      formData.append("code", newProductData.code.trim())
      formData.append("barcode", newProductData.barcode)
      formData.append("name", newProductData.name.trim())
      formData.append("category_id", newProductData.category_id)
      formData.append("brand_id", newProductData.brand_id)
      formData.append("unit_id", newProductData.unit_id)
      formData.append("purchase_price", newProductData.purchase_price)
      formData.append("selling_price", newProductData.selling_price)
      formData.append("status", "1")
      formData.append("discount", newProductData.discount || "0")
      formData.append("description", newProductData.description || "")

      // Optional fields
      if (newProductData.stock) {
        formData.append("stock", newProductData.stock)
      }
      if (newProductData.rack_location) {
        formData.append("rack_location", newProductData.rack_location)
      }
      if (newProductPhoto) {
        formData.append("photo", newProductPhoto)
      }

      const response = await api.post("/v1/app/products", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      })

      if (response.status === 200 || response.status === 201) {
        setNewProductData({
          code: "",
          barcode: "",
          name: "",
          category_id: "",
          brand_id: "",
          unit_id: "",
          purchase_price: "",
          selling_price: "",
          status: "1",
          stock: "0",
          discount: "",
          rack_location: "",
          description: "",
        })
        setNewProductPhoto(null)
        setFormErrors({})
        setShowAddDialog(false)
        fetchProducts()

        showSuccess(
          "Berhasil menambahkan produk", 
          "Data produk baru telah ditambahkan"
        )
      }
    } catch (err: any) {
      console.error("Error adding product:", err)
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors)
      } else {
        setError(err.response?.data?.message || "Failed to add product")
      }
    }
  }

  // Function to edit a product
  const editProduct = async () => {
    // Reset error state
    setFormErrors({})
    
    const errors: Record<string, string> = {}
    
    // Log untuk debugging
    console.log("Validating edit data:", editProductData)

    // Validasi
    if (!editProductData.code || editProductData.code.trim() === "") {
      errors.code = "Kode produk wajib diisi"
    }
    if (!editProductData.name || editProductData.name.trim() === "") {
      errors.name = "Nama produk wajib diisi"
    }
    if (!editProductData.category_id) {
      errors.category_id = "Kategori wajib diisi"
    }
    if (!editProductData.brand_id) {
      errors.brand_id = "Brand wajib diisi"
    }
    if (!editProductData.unit_id) {
      errors.unit_id = "Satuan wajib diisi"
    }
    if (!editProductData.purchase_price) {
      errors.purchase_price = "Harga beli wajib diisi"
    }
    if (!editProductData.selling_price) {
      errors.selling_price = "Harga jual wajib diisi"
    }

    // Log errors untuk debugging
    console.log("Validation errors:", errors)

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "{}")
      const companyId = auth.companyId
      const outletId = auth.outletId

      const formData = new FormData()
      formData.append("company_id", companyId.toString())
      formData.append("outlet_id", outletId.toString())
      formData.append("code", editProductData.code.trim())
      formData.append("barcode", editProductData.barcode || "")
      formData.append("name", editProductData.name.trim())
      formData.append("category_id", editProductData.category_id)
      formData.append("brand_id", editProductData.brand_id)
      formData.append("unit_id", editProductData.unit_id)
      formData.append("purchase_price", editProductData.purchase_price)
      formData.append("selling_price", editProductData.selling_price)
      formData.append("status", editProductData.status || "1")
      formData.append("stock", editProductData.stock || "0")
      formData.append("discount", editProductData.discount || "0")
      formData.append("rack_location", editProductData.rack_location || "")
      formData.append("description", editProductData.description || "")

      if (editProductPhoto) {
        formData.append("photo", editProductPhoto)
      }

      // Update product
      await api.post(`/v1/app/products/${editProductData.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      // Reset form dan tutup dialog
      setEditProductData({
        id: null,
        code: "",
        barcode: "",
        name: "",
        category_id: "",
        brand_id: "",
        unit_id: "",
        purchase_price: "",
        selling_price: "",
        status: "1",
        stock: "",
        discount: "",
        rack_location: "",
        description: "",
      })
      setEditProductPhoto(null)
      setFormErrors({})
      setShowEditDialog(false)
      fetchProducts() // Refresh data

      showSuccess(
        "Berhasil mengedit produk", 
        "Data produk telah diperbarui"
      )
    } catch (err: any) {
      console.error("Error updating product:", err)
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors)
      } else {
        setError(err.response?.data?.message || "Failed to update product")
      }
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
    if (!selectedFile) return

    try {
      const companyId = localStorage.getItem("companyId") || "1"

      const formData = new FormData()
      formData.append("companyId", companyId)
      formData.append("file", selectedFile)

      await api.post("/v1/app/products/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })

      // Reset form and close dialog
      setSelectedFile(null)
      setShowImportDialog(false)

      // Refresh the products list
      fetchProducts()
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to import products")
      console.error("Error importing products:", err)
    }
  }

  // Function to download template
  const downloadTemplate = async () => {
    try {
      const response = await api.get("/v1/app/products/template", {
        responseType: "blob",
      })

      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", "product_template.xlsx")
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
    setNewProductData({
      code: "",
      barcode: "", // Add barcode
      name: "",
      category_id: "",
      brand_id: "",
      unit_id: "",
      purchase_price: "",
      selling_price: "",
      status: "1", // Default status
      stock: "0", // Set default value to "0"
      discount: "",
      rack_location: "",
      description: "", // Change from notes to description
    })
    setNewProductPhoto(null)
    setPhotoError("")
    setFormErrors({})
    setShowAddDialog(true)
  }

  // Handle opening the edit dialog
  const handleOpenEditDialog = (product: Product) => {
    console.log("Opening edit dialog with product:", product) // Debug log
    
    setEditProductData({
      id: product.id,
      code: product.code,
      barcode: product.barcode || "",
      name: product.name,
      // Pastikan konversi ke string
      category_id: product.category_id ? product.category_id.toString() : "",
      brand_id: product.brand_id?.toString() || "",
      unit_id: product.unit_id?.toString() || "",
      purchase_price: product.purchase_price?.toString() || "",
      selling_price: product.selling_price?.toString() || "",
      status: product.status || "1",
      // Pastikan konversi ke string
      stock: product.stock?.toString() || "0",
      discount: product.discount?.toString() || "",
      rack_location: product.rack_location || "",
      description: product.description || "",
    })
    setEditProductPhoto(null)
    setFormErrors({})
    setShowEditDialog(true)
  }

  // Handle opening the import dialog
  const handleOpenImportDialog = () => {
    setSelectedFile(null)
    setShowImportDialog(true)
  }

  // Check if all filtered products are selected
  const allSelected = filteredProducts.length > 0 && filteredProducts.every((product) => product.selected)

  // Check if any product is selected
  const anySelected = products.some((product) => product.selected)

  // Get selected products
  const selectedProducts = products.filter((product) => product.selected)

  // Get confirmation message based on selection
  const getConfirmationMessage = () => {
    if (allSelected) {
      return "Apakah Anda yakin ingin menghapus yang terpilih?"
    } else if (selectedProducts.length === 1) {
      return `Apakah Anda yakin ingin menghapus barang "${selectedProducts[0].name}"?`
    } else {
      const productNames = selectedProducts.map((product) => product.name).join('", "')
      return `Apakah Anda yakin ingin menghapus barang "${productNames}"?`
    }
  }

  // Handle page change
  const handlePageChange = (page: number) => {
    if (paginationMeta && page > 0 && page <= paginationMeta.last_page) {
      setCurrentPage(page)
    }
  }

  const handleLogout = () => {
    // Clear authentication and user data from localStorage
    localStorage.removeItem("auth")
    localStorage.removeItem("companyId")
    localStorage.removeItem("outletId")
    router.replace("/login")
  }

  // Update the user data extraction
  const getUserData = () => {
    let data = {
      email: "",
      name: ""
    }

    try {
      // Try to get from auth context first
      if (auth?.user) {
        data.email = auth.user.email || ""
        data.name = auth.user.name || ""
      }
      
      // Fallback to localStorage if auth context is empty
      if (!data.email || !data.name) {
        const localAuth = JSON.parse(localStorage.getItem("auth") || "{}")
        data.email = localAuth?.user?.email || ""
        data.name = localAuth?.user?.name || ""
      }
    } catch (err) {
      console.error("Error getting user data:", err)
    }

    return data
  }

  // Use the function to get user data
  const { email: userEmail, name: userName } = getUserData()

  // Add this function before the return statement
  const handleViewProduct = (id: number) => {
    // Navigate to product detail page
    router.push(`/master/barang/${id}`)
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
                    <AvatarFallback>
                      {userName || userEmail ? (userName || userEmail)[0].toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-sm font-medium">
                      {userName || userEmail?.split("@")[0] || "User"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {userEmail}
                    </span>
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
            <h2 className="text-xl font-semibold">Barang</h2>
            <p className="text-sm text-gray-500">Master - Barang</p>
          </div>

          {/* Content wrapper */}
          <div className="rounded-lg bg-white p-4 lg:p-6 shadow-sm">
            {/* Action buttons - Mobile responsive */}
            <div className="mb-4 space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between">
              <div className="flex items-center gap-2">
                <Select
                  value={perPage.toString()}
                  onValueChange={(value) => {
                    setPerPage(Number(value))
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

              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search"
                    className="pl-9 w-full"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-1 flex-1 sm:flex-none">
                        <span className="hidden sm:inline">Import/Export</span>
                        <span className="sm:hidden">Import</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleOpenImportDialog}>Import Data</DropdownMenuItem>
                      <DropdownMenuItem onClick={downloadTemplate}>Export Data</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Delete button positioned between Import and Add */}
                  {anySelected && (
                    <Button
                      variant="destructive"
                      className="flex items-center gap-1 flex-1 sm:flex-none"
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

            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow className="hover:bg-gray-50">
                    <TableHead className="w-[5%] p-4 text-center">
                      <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                    </TableHead>
                    <TableHead className="w-[5%] p-4 text-center">No</TableHead>
                    <TableHead className="w-[5%] p-4">Foto</TableHead>
                    <TableHead className="w-[10%] p-4">Kode</TableHead>
                    <TableHead className="w-[10%] p-4">Nama</TableHead>
                    <TableHead className="w-[10%] p-4">Kategori</TableHead>
                    <TableHead className="w-[5%] p-4">Satuan</TableHead>
                    <TableHead className="w-[10%] p-4 text-right">Harga Beli</TableHead>
                    <TableHead className="w-[10%] p-4 text-right">Harga Jual</TableHead>
                    <TableHead className="w-[8%] p-4 text-center">Stok</TableHead>
                    <TableHead className="w-[8%] p-4 text-center">Diskon</TableHead>
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
                  ) : filteredProducts.length > 0 ? (
                    filteredProducts.map((product, index) => (
                      <TableRow
                        key={product.id}
                        className={index % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50/30 hover:bg-gray-50"}
                      >
                        <TableCell className="p-4 border-t border-gray-100 text-center">
                          <Checkbox
                            checked={product.selected}
                            onCheckedChange={() => toggleSelectProduct(product.id)}
                          />
                        </TableCell>
                        <TableCell className="p-4 border-t border-gray-100 text-center">
                          {index + 1}
                        </TableCell>
                        <TableCell className="p-4 border-t border-gray-100">
                          <div className="h-10 w-10 rounded border bg-gray-100 flex items-center justify-center overflow-hidden">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-6 w-6 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                        </TableCell>
                        <TableCell className="p-4 border-t border-gray-100">{product.code}</TableCell>
                        <TableCell className="p-4 border-t border-gray-100">{product.name}</TableCell>
                        <TableCell className="p-4 border-t border-gray-100">
                          {product.category?.name}
                        </TableCell>
                        <TableCell className="p-4 border-t border-gray-100">
                          {product.unit?.name}
                        </TableCell>
                        <TableCell className="p-4 border-t border-gray-100 text-right">
                          {product.purchase_price ? product.purchase_price.toLocaleString("id-ID") : "-"}
                        </TableCell>
                        <TableCell className="p-4 border-t border-gray-100 text-right">
                          {product.selling_price ? product.selling_price.toLocaleString("id-ID") : "-"}
                        </TableCell>
                        <TableCell className="p-4 border-t border-gray-100 text-center">
                          {product.stock}
                        </TableCell>
                        <TableCell className="p-4 border-t border-gray-100 text-center">
                          {product.discount ? `${product.discount}%` : "-"}
                        </TableCell>
                        <TableCell className="p-4 border-t border-gray-100">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleViewProduct(product.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleOpenEditDialog(product)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setProducts(
                                  products.map((p) => (p.id === product.id ? { ...p, selected: true } : p))
                                )
                                setFilteredProducts(
                                  filteredProducts.map((p) => (p.id === product.id ? { ...p, selected: true } : p))
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
                  Page {paginationMeta.current_page} to {paginationMeta.last_page} of {paginationMeta.total} entries
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

                  <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700">
                    1
                  </Button>

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

      {/* Add Product Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-4 sm:p-6 shadow-lg">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-base sm:text-lg font-semibold">Tambah Barang</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product-photo">Foto Barang (Opsional)</Label>
                <div className="flex items-center gap-4">
                  {newProductPhoto && (
                    <div className="relative h-20 w-20">
                      <img
                        src={URL.createObjectURL(newProductPhoto)}
                        alt="Preview"
                        className="h-full w-full rounded object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -right-2 -top-2 h-6 w-6"
                        onClick={() => setNewProductPhoto(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border bg-gray-100 px-4 py-2 hover:bg-gray-200">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setNewProductPhoto(e.target.files[0])
                          setPhotoError("")
                        }
                      }}
                    />
                    <span className="text-sm">Pilih Foto</span>
                  </label>
                </div>
                {photoError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{photoError}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-code">Kode</Label>
                <Input
                  id="product-code"
                  name="code"
                  value={newProductData.code}
                  onChange={handleNewProductChange}
                  placeholder="Masukkan kode barang"
                />
                {formErrors.code && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{formErrors.code}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-barcode">Barcode (Opsional)</Label>
                <Input
                  id="product-barcode"
                  name="barcode"
                  value={newProductData.barcode}
                  onChange={handleNewProductChange}
                  placeholder="Masukkan barcode barang"
                />
                {formErrors.barcode && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{formErrors.barcode}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-nama">Nama</Label>
                <Input
                  id="product-nama"
                  name="name"
                  value={newProductData.name}
                  onChange={handleNewProductChange}
                  placeholder="Masukkan nama barang"
                />
                {formErrors.name && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{formErrors.name}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Category Select */}
              <div className="space-y-2">
                <Label htmlFor="product-category">Kategori</Label>
                <Select
                  value={newProductData.category_id}
                  onValueChange={(value) => {
                    setNewProductData({ ...newProductData, category_id: value })
                    if (formErrors.category_id) {
                      setFormErrors({ ...formErrors, category_id: "" })
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories && categories.length > 0 ? (
                      categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-data" disabled>
                        Tidak ada kategori
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {formErrors.category_id && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{formErrors.category_id}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Brand Select */}
              <div className="space-y-2">
                <Label htmlFor="product-brand">Brand/Merk</Label>
                <Select
                  value={newProductData.brand_id}
                  onValueChange={(value) => {
                    console.log("Brand terpilih:", value)
                    setNewProductData(prev => ({ ...prev, brand_id: value }))
                    // Clear error when value is selected
                    if (formErrors.brand_id) {
                      setFormErrors(prev => ({ ...prev, brand_id: "" }))
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih brand/merk" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands && brands.length > 0 ? (
                      brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id.toString()}>
                          {brand.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-data" disabled>
                        Tidak ada brand/merk
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {formErrors.brand_id && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{formErrors.brand_id}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Unit Select */}
              <div className="space-y-2">
                <Label htmlFor="product-unit">Satuan</Label>
                <Select
                  value={newProductData.unit_id}
                  onValueChange={(value) => {
                    console.log("Satuan terpilih:", value)
                    setNewProductData(prev => ({ ...prev, unit_id: value }))
                    // Clear error when value is selected
                    if (formErrors.unit_id) {
                      setFormErrors(prev => ({ ...prev, unit_id: "" }))
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih satuan" />
                  </SelectTrigger>
                  <SelectContent>
                    {units && units.length > 0 ? (
                      units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id.toString()}>
                          {unit.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-data" disabled>
                        Tidak ada satuan
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {formErrors.unit_id && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{formErrors.unit_id}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-harga-beli">Harga Beli</Label>
                <Input
                  id="product-harga-beli"
                  name="purchase_price"
                  type="text" // Ubah dari number ke text
                  value={formatNumber(newProductData.purchase_price)} // Format dengan pemisah ribuan
                  onChange={handlePriceChange}
                  placeholder="Masukkan harga beli barang"
                />
                {formErrors.purchase_price && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{formErrors.purchase_price}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-harga-jual">Harga Jual</Label>
                <Input
                  id="product-harga-jual"
                  name="selling_price"
                  type="text" // Ubah dari number ke text
                  value={formatNumber(newProductData.selling_price)} // Format dengan pemisah ribuan
                  onChange={handlePriceChange}
                  placeholder="Masukkan harga jual barang"
                />
                {formErrors.selling_price && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{formErrors.selling_price}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Add these fields after the harga_jual input */}
              <div className="space-y-2">
                <Label htmlFor="product-stock">Stok Awal (Opsional)</Label>
                <Input
                  id="product-stock"
                  name="stock"
                  type="number"
                  value={newProductData.stock}
                  onChange={handleNewProductChange}
                  placeholder="Masukkan stok awal barang"
                />
                {formErrors.stock && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{formErrors.stock}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-discount">Diskon % (Opsional)</Label>
                <Input
                  id="product-discount"
                  name="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={newProductData.discount}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    if (value > 100) {
                      setDiscountError("Diskon tidak boleh lebih dari 100%")
                      // Tetap gunakan nilai sebelumnya
                      return
                    }
                    // Clear error jika nilai valid
                    setDiscountError("")
                    setNewProductData({ ...newProductData, discount: e.target.value })
                  }}
                  onKeyPress={(e) => {
                    // Mencegah input karakter selain angka
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault()
                    }
                  }}
                  placeholder="Masukkan diskon dalam persen (0-100)"
                  className={discountError ? "border-red-500" : ""}
                />
                {discountError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{discountError}</AlertDescription>
                  </Alert>
                )}
                {formErrors.discount && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{formErrors.discount}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-rack">Letak Rak (Opsional)</Label>
                <Input
                  id="product-rack"
                  name="rack_location"
                  value={newProductData.rack_location}
                  onChange={handleNewProductChange}
                  placeholder="Masukkan lokasi rak"
                />
                {formErrors.rack_location && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{formErrors.rack_location}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-description">Keterangan (Opsional)</Label>
                <Input
                  id="product-description"
                  name="description" // Change from notes to description
                  value={newProductData.description} // Change from notes to description
                  onChange={handleNewProductChange}
                  placeholder="Masukkan keterangan tambahan"
                />
                {formErrors.description && ( // Change from notes to description
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{formErrors.description}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="w-full sm:w-auto">
              Batal
            </Button>
            <Button onClick={addProduct} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
              Tambah
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-4 sm:p-6 shadow-lg">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-base sm:text-lg font-semibold">Edit Barang</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              {/* Photo Input */}
              <div className="space-y-2">
                <Label htmlFor="edit-product-photo">Foto Barang (Opsional)</Label>
                <div className="flex items-center gap-4">
                  {editProductPhoto && (
                    <div className="relative h-20 w-20">
                      <img
                        src={URL.createObjectURL(editProductPhoto)}
                        alt="Preview"
                        className="h-full w-full rounded object-cover"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -right-2 -top-2 h-6 w-6"
                        onClick={() => setEditProductPhoto(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <label className="flex cursor-pointer items-center gap-2 rounded-md border bg-gray-100 px-4 py-2 hover:bg-gray-200">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setEditProductPhoto(e.target.files[0])
                          setPhotoError("")
                        }
                      }}
                    />
                    <span className="text-sm">Pilih Foto</span>
                  </label>
                </div>
                {photoError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{photoError}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-product-code">Kode</Label>
                <Input
                  id="edit-product-code"
                  name="code"
                  value={editProductData.code}
                  onChange={handleEditProductChange}
                  placeholder="Masukkan kode barang"
                />
                {formErrors.code && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{formErrors.code}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-product-barcode">Barcode (Opsional)</Label>
                <Input
                  id="edit-product-barcode"
                  name="barcode"
                  value={editProductData.barcode}
                  onChange={handleEditProductChange}
                  placeholder="Masukkan barcode barang"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-product-nama">Nama</Label>
                <Input
                  id="edit-product-nama"
                  name="name"
                  value={editProductData.name}
                  onChange={handleEditProductChange}
                  placeholder="Masukkan nama barang"
                />
                {formErrors.name && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{formErrors.name}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Category Select */}
              <div className="space-y-2">
                <Label htmlFor="edit-product-category">Kategori</Label>
                <Select
                  value={editProductData.category_id || ""}
                  onValueChange={(value) => {
                    setEditProductData(prev => ({
                      ...prev,
                      category_id: value
                    }))
                    if (formErrors.category_id) {
                      setFormErrors(prev => ({ ...prev, category_id: "" }))
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem 
                        key={category.id} 
                        value={category.id.toString()}
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Brand Select */}
              <div className="space-y-2">
                <Label htmlFor="edit-product-brand">Brand/Merk</Label>
                <Select
                  value={editProductData.brand_id || ""}
                  onValueChange={(value) => {
                    setEditProductData(prev => ({
                      ...prev,
                      brand_id: value
                    }))
                    if (formErrors.brand_id) {
                      setFormErrors(prev => ({ ...prev, brand_id: "" }))
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih brand/merk" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id.toString()}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Unit Select */}
              <div className="space-y-2">
                <Label htmlFor="edit-product-unit">Satuan</Label>
                <Select
                  value={editProductData.unit_id || ""}
                  onValueChange={(value) => {
                    setEditProductData(prev => ({
                      ...prev,
                      unit_id: value
                    }))
                    if (formErrors.unit_id) {
                      setFormErrors(prev => ({ ...prev, unit_id: "" }))
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih satuan" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id.toString()}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-product-harga-beli">Harga Beli</Label>
                <Input
                  id="edit-product-harga-beli"
                  name="harga_beli"
                  type="text"
                  value={formatNumber(editProductData.purchase_price)}
                  onChange={handleEditPriceChange}
                  placeholder="Masukkan harga beli barang"
                />
                {formErrors.purchase_price && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{formErrors.purchase_price}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-product-harga-jual">Harga Jual</Label>
                <Input
                  id="edit-product-harga-jual"
                  name="harga_jual"
                  type="text"
                  value={formatNumber(editProductData.selling_price)}
                  onChange={handleEditPriceChange}
                  placeholder="Masukkan harga jual barang"
                />
                {formErrors.selling_price && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{formErrors.selling_price}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Perbaiki input stok pada form edit */}
              <div className="space-y-2">
                <Label htmlFor="edit-product-stock">Stok Awal (Opsional)</Label>
                <Input
                  id="edit-product-stock"
                  name="stock"
                  type="number"
                  value={editProductData.stock} // Ganti dari newProductData ke editProductData
                  onChange={handleEditProductChange}
                  placeholder="Masukkan stok awal barang"
                />
                {formErrors.stock && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{formErrors.stock}</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Perbaiki input diskon pada form edit */}
              <div className="space-y-2">
                <Label htmlFor="edit-product-discount">Diskon % (Opsional)</Label>
                <Input
                  id="edit-product-discount"
                  name="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={editProductData.discount} // Ganti dari newProductData ke editProductData
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    if (value > 100) {
                      setDiscountError("Diskon tidak boleh lebih dari 100%")
                      return
                    }
                    setDiscountError("")
                    setEditProductData(prev => ({ ...prev, discount: e.target.value })) // Gunakan setEditProductData
                  }}
                  onKeyPress={(e) => {
                    if (!/[0-9]/.test(e.key)) {
                      e.preventDefault()
                    }
                  }}
                  placeholder="Masukkan diskon dalam persen (0-100)"
                  className={discountError ? "border-red-500" : ""}
                />
                {discountError && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{discountError}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-rack">Letak Rak (Opsional)</Label>
                <Input
                  id="product-rack"
                  name="rack_location"
                  value={newProductData.rack_location}
                  onChange={handleNewProductChange}
                  placeholder="Masukkan lokasi rak"
                />
                {formErrors.rack_location && (
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{formErrors.rack_location}</AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-description">Keterangan (Opsional)</Label>
                <Input
                  id="product-description"
                  name="description" // Change from notes to description
                  value={newProductData.description} // Change from notes to description
                  onChange={handleNewProductChange}
                  placeholder="Masukkan keterangan tambahan"
                />
                {formErrors.description && ( // Change from notes to description
                  <Alert variant="destructive" className="py-2 mt-2">
                    <AlertDescription className="text-sm">{formErrors.description}</AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="w-full sm:w-auto">
              Batal
            </Button>
            <Button onClick={editProduct} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
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
            <div className="space-y-2">
              <p className="text-sm">
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

            <div className="space-y-2">
              <p className="text-sm">Pilih File</p>
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
          <DialogFooter className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
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
        position="fixed top-4 right-4 left-4 sm:left-auto z-50"
        duration={5000}
        className="max-w-[calc(100%-2rem)] sm:max-w-md bg-white rounded-lg shadow-lg"
      />
    </div>
  )
}

export default Page
