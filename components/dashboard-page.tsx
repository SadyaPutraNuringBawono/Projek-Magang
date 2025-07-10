"use client"

import { useEffect, useState } from "react"
import {
  Bell,
  ChevronDown,
  DollarSign,
  ArrowLeftRight,
  LogOut,
  CheckCircle,
  Menu,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sidebar } from "./sidebar"
import { DatePicker } from "./date-picker"
import { useAuth } from "./auth-provider"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { format, parseISO } from "date-fns"
import { id } from "date-fns/locale"
import api from "@/lib/api"
import { useRouter } from "next/navigation"

interface SalesItem {
  code: string
  name: string
  totalQuantity: number
  transactionCount: number
  income: number
  profit: number
}

export function DashboardPage() {
  const { userEmail, logout, isLoggedIn } = useAuth()
  const [salesData, setSalesData] = useState<SalesItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [totalTransaction, setTotalTransaction] = useState(0)
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalProfit, setTotalProfit] = useState(0)
  const [outletId, setOutletId] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState({
    start: "2025-02-01",
    end: "2025-02-28",
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  const formattedDateRange = `${format(
    parseISO(selectedDate.start),
    "d MMMM yyyy",
    {
      locale: id,
    }
  )} - ${format(parseISO(selectedDate.end), "d MMMM yyyy", { locale: id })}`

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("id-ID").format(value)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID").format(amount)
  }

  useEffect(() => {
    const savedOutletId = localStorage.getItem("outlet_id")
    if (savedOutletId) {
      setOutletId(Number(savedOutletId))
    }
  }, [userEmail])

  useEffect(() => {
    if (!outletId) return

    async function fetchSalesData() {
      setLoading(true)
      setError("")

      try {
        const response = await api.get(`/v1/app/dashboard`, {
          params: {
            outlet_id: outletId,
            date_start: selectedDate.start,
            date_end: selectedDate.end,
          },
        })

        setSalesData(response.data.data.items || [])
      } catch (err: any) {
        setError(err.response?.data?.message || "Gagal mengambil data")
      } finally {
        setLoading(false)
      }
    }

    fetchSalesData()
  }, [selectedDate, outletId])

  useEffect(() => {
    const totalTransaction = salesData.reduce(
      (sum, item) => sum + item.transactionCount,
      0
    )
    const totalIncome = salesData.reduce((sum, item) => sum + item.income, 0)
    const totalProfit = salesData.reduce((sum, item) => sum + item.profit, 0)

    setTotalTransaction(totalTransaction)
    setTotalIncome(totalIncome)
    setTotalProfit(totalProfit)
  }, [salesData])

  const handleLogout = () => {
    logout()
    router.replace("/login")
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
      <div
        className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#00A651] transform transition-transform duration-200 ease-in-out lg:relative lg:transform-none flex flex-col
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      >
        <div className="overflow-y-auto flex-1">
          <Sidebar />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 flex items-center justify-between bg-white px-3 py-3 sm:px-4 sm:py-4 shadow-sm lg:px-6">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-md lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <h1 className="text-lg sm:text-xl font-semibold hidden sm:block">
              Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Bell className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-1 sm:gap-2 p-1 sm:p-2">
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                    <AvatarFallback>
                      {userEmail ? userEmail[0].toUpperCase() : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:flex flex-col items-start">
                    <span className="text-sm font-medium line-clamp-1">
                      {userEmail ? userEmail.split("@")[0] : "User"}
                    </span>
                    <span className="text-xs text-gray-500 line-clamp-1">
                      {userEmail}
                    </span>
                  </div>
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

        <main className="p-3 sm:p-4 lg:p-6 max-w-[1920px] mx-auto">
          {/* DatePicker Section - Make it more responsive */}
          <div className="mb-4 sm:mb-6">
            <DatePicker
              value={{ start: selectedDate.start, end: selectedDate.end }}
              onChange={(newDate) => {
                setSelectedDate(newDate)
              }}
              className="w-full max-w-sm"
            />
          </div>

          {/* Stats Cards - Enhanced grid responsiveness */}
          <div className="mb-6 sm:mb-8 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {/* Transaction Card */}
            <div className="rounded-lg bg-white p-3 sm:p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-3 sm:mb-4 flex items-center gap-2">
                <div className="rounded-full bg-green-100 p-1.5 sm:p-2">
                  <ArrowLeftRight className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <h3 className="font-medium text-sm sm:text-base">
                  Jumlah Transaksi
                </h3>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-right">
                {formatNumber(totalTransaction)}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-2">
                {formattedDateRange}
              </p>
            </div>

            {/* Income Card */}
            <div className="rounded-lg bg-white p-3 sm:p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-3 sm:mb-4 flex items-center gap-2">
                <div className="rounded-full bg-green-100 p-1.5 sm:p-2">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <h3 className="font-medium text-sm sm:text-base">Pendapatan</h3>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-green-600 text-right">
                Rp {formatCurrency(totalIncome)}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-2">
                {formattedDateRange}
              </p>
            </div>

            {/* Profit Card */}
            <div className="rounded-lg bg-white p-3 sm:p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-3 sm:mb-4 flex items-center gap-2">
                <div className="rounded-full bg-green-100 p-1.5 sm:p-2">
                  <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                </div>
                <h3 className="font-medium text-sm sm:text-base">Keuntungan</h3>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-green-600 text-right">
                Rp {formatCurrency(totalProfit)}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 mt-2">
                {formattedDateRange}
              </p>
            </div>
          </div>

          {/* Table Section - Enhanced responsiveness */}
          {loading ? (
            <div className="flex justify-center p-8">
              <p>Loading data...</p>
            </div>
          ) : error ? (
            <div className="flex justify-center p-8">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            <div className="rounded-lg bg-white p-3 sm:p-4 lg:p-6 shadow-sm">
              <div className="mb-4 space-y-1">
                <h2 className="text-base sm:text-lg font-semibold">
                  Laporan Penjualan Barang
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">
                  {formattedDateRange}
                </p>
              </div>
              <div className="overflow-x-auto -mx-3 sm:-mx-4 lg:-mx-6">
                <div className="inline-block min-w-full align-middle p-3 sm:p-4 lg:p-6">
                  <div className="overflow-hidden rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="whitespace-nowrap py-3 text-xs sm:text-sm">
                            Kode
                          </TableHead>
                          <TableHead className="whitespace-nowrap py-3 text-xs sm:text-sm">
                            Nama
                          </TableHead>
                          <TableHead className="whitespace-nowrap py-3 text-xs sm:text-sm text-right">
                            Jumlah Barang
                          </TableHead>
                          <TableHead className="whitespace-nowrap py-3 text-xs sm:text-sm text-right">
                            Jumlah Transaksi
                          </TableHead>
                          <TableHead className="whitespace-nowrap py-3 text-xs sm:text-sm text-right">
                            Keuntungan
                          </TableHead>
                          <TableHead className="whitespace-nowrap py-3 text-xs sm:text-sm text-right">
                            Pendapatan
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salesData.length > 0 ? (
                          salesData.map((item) => (
                            <TableRow key={item.code}>
                              <TableCell className="py-3 text-xs sm:text-sm">
                                {item.code}
                              </TableCell>
                              <TableCell className="py-3 text-xs sm:text-sm">
                                {item.name}
                              </TableCell>
                              <TableCell className="py-3 text-xs sm:text-sm text-right">
                                {item.totalQuantity}
                              </TableCell>
                              <TableCell className="py-3 text-xs sm:text-sm text-right">
                                {formatNumber(item.transactionCount)}
                              </TableCell>
                              <TableCell className="py-3 text-xs sm:text-sm text-right">
                                Rp {formatCurrency(item.profit)}
                              </TableCell>
                              <TableCell className="py-3 text-xs sm:text-sm text-right">
                                Rp {formatCurrency(item.income)}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={6}
                              className="text-center py-4 text-sm text-gray-500"
                            >
                              Tidak ada data untuk periode ini
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
