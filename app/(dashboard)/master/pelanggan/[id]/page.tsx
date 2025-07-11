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

interface customer {
  id: string
  code: string
  name: string
  type: string
  email: string
  address: string
  notes: string
  phone: string
  registrationDate: string
}

interface Transaction {
  id: string
  date: string
  amount: number
  type: string
  description: string
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { userEmail, logout } = useAuth()
  const [customer, setcustomer] = useState<customer | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [paymentHistory, setPaymentHistory] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isSidebarOpen, setSidebarOpen] = useState(false)

  const customerId = params.id as string

  const fetchcustomerData = async () => {
    setLoading(true)
    setError("")

    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "{}")
      const companyId = auth.companyId

      // Only fetch customer data
      const response = await api.get(`/v1/app/customers/${customerId}`, {
        params: {
          company_id: companyId
        }
      })

      console.log("customer response:", response.data)

      if (response.data?.data) {
        setcustomer(response.data.data)
        // Set empty arrays for transactions and payments since APIs don't exist
        setTransactions([])
        setPaymentHistory([])
      } else {
        setError("customer tidak ditemukan")
      }
    } catch (err: any) {
      console.error("Error fetching customer:", err)
      setError(err.response?.data?.message || "Gagal mengambil data customer")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (customerId) {
      console.log("Fetching customer data for ID:", customerId)
      fetchcustomerData()
    }
  }, [customerId])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID").format(amount)
  }

  const handleBack = () => {
    router.push("/master/pelanggan")
  }

  const handleLogout = () => {
    logout()
  }

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

  if (error || !customer) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1">
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-red-500 mb-4">{error || "customer tidak ditemukan"}</p>
            <Button onClick={handleBack} variant="outline">
              Kembali ke Daftar Pelanggan
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

          <div className="flex items-center gap-2">
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

        {/* Main content with responsive padding */}
        <main className="p-4 sm:p-6">
          {/* Breadcrumb */}
          <div className="mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">Pelanggan</h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Master - Pelanggan
              <span className="text-red-500 font-medium">
                {customer ? ` - ${customer.name}` : ""}
              </span>
            </p>
          </div>

          {/* Responsive card layout */}
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">
            {/* customer Card - Full width on mobile */}
            <Card className="w-full lg:w-[350px] border-2 border-blue-400">
              <CardContent className="pt-8 flex flex-col items-center">
                <div className="text-xl font-semibold mb-1">{customer.name}</div>
                <div className="text-base mb-3">{customer.code}</div>
                <div className="mb-4">
                  <div className="rounded-full bg-gray-200 w-16 h-16 flex items-center justify-center">
                    <User className="w-8 h-8 text-gray-500" />
                  </div>
                </div>
                <div className="w-full text-sm">
                  <div className="flex mb-1">
                    <div className="w-28">Tipe</div>
                    <div className="w-2">:</div>
                    <div>{customer.type || "-"}</div>
                  </div>
                  <div className="flex mb-1">
                    <div className="w-28">Email</div>
                    <div className="w-2">:</div>
                    <div>{customer.email || "-"}</div>
                  </div>
                  <div className="flex mb-1">
                    <div className="w-28">Alamat</div>
                    <div className="w-2">:</div>
                    <div>{customer.address || "-"}</div>
                  </div>
                  <div className="flex mb-1">
                    <div className="w-28">Keterangan</div>
                    <div className="w-2">:</div>
                    <div>{customer.notes || "-"}</div>
                  </div>
                  <div className="flex mb-1">
                    <div className="w-28">Tgl Bergabung</div>
                    <div className="w-2">:</div>
                    <div>{customer.registrationDate || "-"}</div>
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
                      <div className="space-y-3">
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
                    {paymentHistory.length === 0 ? (
                      <div className="border mt-2 rounded text-center py-4 text-sm text-gray-500">
                        Tidak Ada Riwayat Pembayaran
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {paymentHistory.map((payment) => (
                          <div key={payment.id} className="flex justify-between border-b pb-2">
                            <div>
                              <p className="font-medium">{payment.description}</p>
                              <p className="text-sm text-gray-500">{payment.date}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">Rp {formatCurrency(payment.amount)}</p>
                              <p className="text-sm text-gray-500">{payment.type}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
