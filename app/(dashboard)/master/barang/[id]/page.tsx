"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Bell, ChevronDown, LogOut, User, ArrowLeft, Menu } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/components/auth-provider"
import api from "@/lib/api"

interface Product {
  id: number
  code: string
  name: string
  category_id: number
  brand_id: number
  unit_id: number
  purchase_price: number
  selling_price: number
  barcode?: string
  photo?: string
  stock?: number
  discount?: number
  rack_location?: string
  description?: string
  // Add separate state for related data names
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

interface Transaction {
  id: string
  date: string
  amount: number
  type: string
  description: string
}

export default function productDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { userEmail, logout } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [paymentHistory, setPaymentHistory] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [categories, setCategories] = useState<Array<{ id: number; name: string }>>([])
  const [brands, setBrands] = useState<Array<{ id: number; name: string }>>([])
  const [units, setUnits] = useState<Array<{ id: number; name: string }>>([])
  const [isSidebarOpen, setSidebarOpen] = useState(false)

  const productId = params.id as string

  const fetchProductData = async () => {
    setLoading(true)
    setError("")

    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "{}")
      const companyId = auth.companyId

      // Fetch all required data in parallel
      const [productRes, categoriesRes, brandsRes, unitsRes] = await Promise.all([
        api.get(`/v1/app/products/${productId}`),
        api.get('/v1/app/categories', {
          params: { company_id: companyId }
        }),
        api.get('/v1/app/brands', {
          params: { company_id: companyId }
        }),
        api.get('/v1/app/units', {
          params: { company_id: companyId }
        })
      ])

      if (productRes.data?.data) {
        const productData = productRes.data.data
        
        // Find the matching names from the related data
        const category = categoriesRes.data.data.find((c: any) => c.id === parseInt(productData.category_id))
        const brand = brandsRes.data.data.find((b: any) => b.id === parseInt(productData.brand_id))
        const unit = unitsRes.data.data.find((u: any) => u.id === parseInt(productData.unit_id))

        // Set product with resolved names
        setProduct({
          ...productData,
          category_name: category?.name || '-',
          brand_name: brand?.name || '-',
          unit_name: unit?.name || '-'
        })
      } else {
        setError("Barang tidak ditemukan")
      }
    } catch (err: any) {
      console.error("Error fetching product:", err)
      setError(err.response?.data?.message || "Gagal mengambil data barang")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (productId) {
      console.log("Fetching product data for ID:", productId)
      fetchProductData()
    }
  }, [productId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID").format(amount)
  }

  const handleBack = () => {
    router.push("/master/barang")
  }

  const handleLogout = () => {
    logout()
  }

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen)

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1">
          <div className="flex items-center justify-center h-full">
            <p>Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1">
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-red-500 mb-4">{error || "product tidak ditemukan"}</p>
            <Button onClick={handleBack} variant="outline">
              Kembali ke Daftar Barang
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar with mobile toggle */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-200 ease-in-out lg:relative lg:transform-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Header with mobile menu button */}
        <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 sm:px-6 py-3 sm:py-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg sm:text-2xl font-semibold"></h1>
          </div>

          <div className="flex items-center gap-2">
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
                  <span className="hidden sm:inline">
                    {userEmail ? userEmail.split("@")[0] : "User"}
                  </span>
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

        {/* Main content with responsive padding */}
        <main className="p-4 sm:p-6">
          {/* Breadcrumb */}
          <div className="mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">Barang</h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Master - Barang
              <span className="text-red-500 font-medium">
                {product ? ` - ${product.name}` : ""}
              </span>
            </p>
          </div>

          {/* Responsive card layout */}
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
            {/* Product Card - Full width on mobile */}
            <Card className="w-full lg:w-[350px] border-2 border-blue-400">
              <CardContent className="pt-8 flex flex-col items-center">
                <div className="text-xl font-semibold mb-1">{product.name}</div>
                <div className="text-base mb-3">{product.code}</div>
                <div className="mb-4">
                  <div className="rounded-full bg-gray-200 w-16 h-16 flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-500" />
                  </div>
                </div>
                <div className="w-full text-sm">
                  <div className="flex mb-1">
                    <div className="w-28">Kategori</div>
                    <div className="w-2">:</div>
                    <div>{product.category?.name || "-"}</div>
                  </div>
                  <div className="flex mb-1">
                    <div className="w-28">Brand</div>
                    <div className="w-2">:</div>
                    <div>{product.brand?.name || "-"}</div>
                  </div>
                  <div className="flex mb-1">
                    <div className="w-28">Satuan</div>
                    <div className="w-2">:</div>
                    <div>{product.unit?.name || "-"}</div>
                  </div>
                  <div className="flex mb-1">
                    <div className="w-28">Harga Beli</div>
                    <div className="w-2">:</div>
                    <div>Rp {formatCurrency(product.purchase_price)}</div>
                  </div>
                  <div className="flex mb-1">
                    <div className="w-28">Harga Jual</div>
                    <div className="w-2">:</div>
                    <div>Rp {formatCurrency(product.selling_price)}</div>
                  </div>
                  <div className="flex mb-1">
                    <div className="w-28">Stok</div>
                    <div className="w-2">:</div>
                    <div>{product.stock || "-"}</div>
                  </div>
                  <div className="flex mb-1">
                    <div className="w-28">Barcode</div>
                    <div className="w-2">:</div>
                    <div>{product.barcode || "-"}</div>
                  </div>
                  <div className="flex mb-1">
                    <div className="w-28">Diskon</div>
                    <div className="w-2">:</div>
                    <div>{product.discount ? `${product.discount}%` : "-"}</div>
                  </div>
                  <div className="flex mb-1">
                    <div className="w-28">Lokasi Rak</div>
                    <div className="w-2">:</div>
                    <div>{product.rack_location || "-"}</div>
                  </div>
                  <div className="flex mb-1">
                    <div className="w-28">Deskripsi</div>
                    <div className="w-2">:</div>
                    <div>{product.description || "-"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs - Full width on mobile */}
            <div className="flex-1 min-w-0">
              <div className="rounded-lg bg-white shadow p-4">
                <Tabs defaultValue="transactions" className="w-full">
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="transactions">Transaksi</TabsTrigger>
                    <TabsTrigger value="payments">Riwayat Pembayaran</TabsTrigger>
                  </TabsList>
                  <TabsContent value="transactions">
                    {transactions.length === 0 ? (
                      <div className="border mt-2 rounded text-center py-4 text-sm text-gray-500">
                        Tidak Ada Riwayat Transaksi
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {transactions.map((transaction) => (
                          <div key={transaction.id} className="flex justify-between border-b pb-2">
                            <div>
                              <p className="font-medium">{transaction.description}</p>
                              <p className="text-sm text-gray-500">{transaction.date}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">Rp {formatCurrency(transaction.amount)}</p>
                              <p className="text-sm text-gray-500">{transaction.type}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="payments">
                    <div className="border mt-2 rounded text-center py-4 text-sm text-gray-500">
                      Tidak Ada Riwayat Pembayaran
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
