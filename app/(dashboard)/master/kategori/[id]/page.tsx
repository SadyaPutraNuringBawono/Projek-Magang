"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Pencil, X, ChevronLeft, Search, Trash2, AlertCircle, Plus, Eye, Bell, ChevronDown, LogOut, Menu } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import Link from "next/link"
import Image from "next/image"
import { useRouter, useParams } from "next/navigation"
import axios from "axios"
import api from "@/lib/api"

interface Product {
  id: number
  photo: string
  code: string
  name: string
  purchase_price: number
  selling_price: number
  discount: number
  stock: number
  unit: {
    id: number
    name: string
  }
}

interface Category {
  id: number
  code: string
  name: string
  company: {
    id: number
    name: string
  }
  products: Product[]
  created_at: string
  updated_at: string
}

export default function CategoryDetailPage() {
  const { userEmail, logout } = useAuth()
  const params = useParams()
  const categoryId = params.id as string
  const router = useRouter()

  const [category, setCategory] = useState<Category | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isSidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const fetchCategoryDetails = async () => {
      setLoading(true)
      setError("")

      try {
        const response = await api.get(`/v1/app/categories/${categoryId}`)
        setCategory(response.data.data)
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch category details")
        console.error("Error fetching category details:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchCategoryDetails()
  }, [categoryId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID").format(amount)
  }

  const handleLogout = () => {
    logout()
    router.replace("/login")
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 p-6">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <p>Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !category) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 p-6">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <p>Kategori tidak ditemukan</p>
            )}
            <Link href="/master/kategori">
              <Button className="mt-4">Kembali</Button>
            </Link>
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
        <header className="flex items-center justify-between bg-white px-4 sm:px-6 py-3 sm:py-4 shadow-sm">
          <div className="flex items-center gap-2">
            {/* Mobile menu button */}
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

          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{userEmail ? userEmail[0].toUpperCase() : "U"}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline">{userEmail ? userEmail.split("@")[0] : "User"}</span>
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
          <div className="mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">Detail Kategori</h2>
            <p className="text-xs sm:text-sm text-gray-500">Master - Kategori</p>
            <p className="mt-2 text-sm sm:text-md">
              {category.code} - {category.name}
            </p></div>

          <div className="rounded-lg bg-white p-4 sm:p-6 shadow-sm">
            {/* Responsive table container */}
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="min-w-full inline-block align-middle p-4 sm:p-0">
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow className="hover:bg-gray-50">
                        <TableHead className="w-12 p-4">No</TableHead>
                        <TableHead className="p-4">Foto</TableHead>
                        <TableHead className="p-4">Kode</TableHead>
                        <TableHead className="p-4">Nama</TableHead>
                        <TableHead className="p-4 text-right">Harga Jual (Rp)</TableHead>
                        <TableHead className="p-4 text-right">Harga Beli (Rp)</TableHead>
                        <TableHead className="p-4 text-right">Diskon (Rp)</TableHead>
                        <TableHead className="p-4 text-right">Stok</TableHead>
                        <TableHead className="p-4">Satuan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-200">
                      {category.products && category.products.length > 0 ? (
                        category.products.map((product, index) => (
                          <TableRow
                            key={product.id}
                            className={index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}
                          >
                            {/* Update table cells for better mobile view */}
                            <TableCell className="whitespace-nowrap p-4 text-sm">
                              {index + 1}
                            </TableCell>
                            <TableCell className="p-4">
                              <div className="relative h-10 w-10 sm:h-12 sm:w-12 overflow-hidden rounded-md border">
                                <Image
                                  src={product.photo || "/placeholder.svg"}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="p-4 border-t border-gray-100">{product.code}</TableCell>
                            <TableCell className="p-4 border-t border-gray-100">{product.name}</TableCell>
                            <TableCell className="p-4 border-t border-gray-100 text-right">
                              {formatCurrency(product.selling_price)}
                            </TableCell>
                            <TableCell className="p-4 border-t border-gray-100 text-right">
                              {formatCurrency(product.purchase_price)}
                            </TableCell>
                            <TableCell className="p-4 border-t border-gray-100 text-right">
                              {formatCurrency(product.discount)}
                            </TableCell>
                            <TableCell className="p-4 border-t border-gray-100 text-right">{product.stock}</TableCell>
                            <TableCell className="p-4 border-t border-gray-100">
                              {product.unit ? product.unit.name : "N/A"}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={9}
                            className="h-24 text-center text-sm text-gray-500"
                          >
                            Tidak ada produk dalam kategori ini
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

