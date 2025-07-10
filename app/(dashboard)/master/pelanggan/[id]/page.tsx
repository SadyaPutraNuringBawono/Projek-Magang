"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Bell, ChevronDown, LogOut, User, ArrowLeft } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/components/auth-provider"
import api from "@/lib/api"

interface Customers {
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

interface Customer {
  id: string
  code: string
  name: string
  email: string
  address: string
  notes: string
  phone: string
  registrationDate: string
}

export default function CustomerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { userEmail, logout } = useAuth()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [paymentHistory, setPaymentHistory] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const customerId = params.id as string

  const fetchCustomerData = async () => {
    setLoading(true)
    setError("")

    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "{}")
      const companyId = auth.companyId

      // Fetch customer data
      const response = await api.get(`/v1/app/customers/${customerId}`, {
        params: {
          company_id: companyId
        }
      })

      if (response.data?.data) {
        setCustomer(response.data.data)
        setTransactions([]) // Kosongkan jika belum ada API transaksi
        setPaymentHistory([]) // Kosongkan jika belum ada API pembayaran
      } else {
        setError("Pelanggan tidak ditemukan")
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Gagal mengambil data pelanggan")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (customerId) {
      fetchCustomerData()
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
            <p className="text-red-500 mb-4">{error || "Pelanggan tidak ditemukan"}</p>
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
      <Sidebar />
      <div className="flex-1">
        <header className="flex items-center justify-between bg-white px-6 py-4 shadow-sm">
          <h1 className="text-2xl font-semibold"></h1>
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
                  <span>{userEmail ? userEmail.split("@")[0] : "User"}</span>
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

        <main className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Pelanggan</h2>
            <p className="text-sm text-gray-500">Master - Pelanggan</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Customer Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gray-100">
                    <User className="h-8 w-8 text-gray-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{customer.name}</h2>
                    <p className="text-sm text-gray-500">{customer.code}</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg border p-2.5">
                    <span className="text-gray-600 text-xs">Email</span>
                    <p className="mt-0.5 font-medium truncate">{customer.email}</p>
                  </div>
                  <div className="rounded-lg border p-2.5">
                    <span className="text-gray-600 text-xs">No. HP</span>
                    <p className="mt-0.5 font-medium">{customer.phone}</p>
                  </div>
                  <div className="rounded-lg border p-2.5">
                    <span className="text-gray-600 text-xs">Alamat</span>
                    <p className="mt-0.5 font-medium truncate">{customer.address}</p>
                  </div>
                  <div className="rounded-lg border p-2.5">
                    <span className="text-gray-600 text-xs">Keterangan</span>
                    <p className="mt-0.5 font-medium truncate">{customer.notes || "-"}</p>
                  </div>
                  <div className="rounded-lg border p-2.5">
                    <span className="text-gray-600 text-xs">Tgl Bergabung</span>
                    <p className="mt-0.5 font-medium">{customer.registrationDate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transaction History */}
            <Card>
              <CardContent className="p-0">
                <Tabs defaultValue="transactions" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="transactions">Transaksi</TabsTrigger>
                    <TabsTrigger value="payments">Riwayat Pembayaran</TabsTrigger>
                  </TabsList>
                  <TabsContent value="transactions" className="p-6">
                    {transactions.length === 0 ? (
                      <div className="flex h-32 items-center justify-center text-gray-500">
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
                  <TabsContent value="payments" className="p-6">
                    {paymentHistory.length === 0 ? (
                      <div className="flex h-32 items-center justify-center text-gray-500">
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
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
