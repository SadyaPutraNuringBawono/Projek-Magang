"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Pencil,
  X,
  ChevronLeft,
  Search,
  Trash2,
  AlertCircle,
  Plus,
  Eye,
  Bell,
  ChevronDown,
  LogOut,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Sidebar } from "@/components/sidebar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
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
import { DatePicker } from "@/components/date-picker"
import Image from "next/image"
import { useRouter, useParams } from "next/navigation"
import axios from "axios"
import api from "@/lib/api"

interface User {
  id: number
  name: string
  email?: string
  phone?: string
  role?: string
  status?: number | string
  outlets?: number[] | string
  company?: {
    id: number
    name: string
  }
  created_at?: string
  updated_at?: string
  selected: boolean
}

export default function UserDetailPage() {
  const { userEmail, logout } = useAuth()
  const params = useParams()
  const userId = params.id as string
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 5
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedDate, setSelectedDate] = useState({
    start: "2025-02-01",
    end: "2025-02-28",
  })

  const logData = [
    {
      time: "2025-04-15 10:00:00",
      via: "Web",
      mode: "Login",
      description: "User melakukan login ke sistem",
    },
    {
      time: "2025-04-15 11:20:30",
      via: "Mobile",
      mode: "Logout",
      description: "User keluar dari aplikasi mobile",
    },
    {
      time: "2025-04-15 13:45:12",
      via: "Web",
      mode: "Update",
      description: "User mengubah data profil",
    },
    {
      time: "2025-04-15 14:00:00",
      via: "Mobile",
      mode: "Login",
      description: "User login melalui aplikasi mobile",
    },
    {
      time: "2025-04-15 16:15:40",
      via: "Web",
      mode: "Delete",
      description: "User menghapus data transaksi",
    },
    {
      time: "2025-04-15 18:05:30",
      via: "Mobile",
      mode: "Update",
      description: "User mengubah pengaturan notifikasi",
    },
    {
      time: "2025-04-15 20:30:00",
      via: "Web",
      mode: "Create",
      description: "User membuat tiket baru",
    },
  ]

  const filteredLogs = logData.filter((log) =>
    log.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalData = filteredLogs.length
  const startIndex = (currentPage - 1) * perPage
  const start = startIndex + 1
  const end = Math.min(startIndex + perPage, totalData)

  const paginatedLogs = filteredLogs.slice(startIndex, startIndex + perPage)

  const paginationMeta = {
    current_page: currentPage,
    last_page: Math.ceil(totalData / perPage),
    from: start,
    to: end,
    total: totalData,
  }

  const handlePageChange = (page: number) => {
    if (paginationMeta && page > 0 && page <= paginationMeta.last_page) {
      setCurrentPage(page)
    }
  }

  useEffect(() => {
    const fetchUserDetails = async () => {
      setLoading(true)
      setError("")

      try {
        const response = await api.get(`/v1/app/users/${userId}`)
        setUser(response.data.data)
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch staff details")
        console.error("Error fetching staff details:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserDetails()
  }, [userId])

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

  if (error || !user) {
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
              <p>User tidak ditemukan</p>
            )}
            <Link href="/pengaturan/staff">
              <Button className="mt-4">Kembali</Button>
            </Link>
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
                    <AvatarFallback>
                      {userEmail ? userEmail[0].toUpperCase() : "U"}
                    </AvatarFallback>
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
            <h2 className="text-xl font-semibold">Pengaturan</h2>
            <p className="text-sm text-gray-500">
              Pengaturan - Manajemen Staff -{" "}
              <span className="text-red-500">{user.name}</span>
            </p>
          </div>

          <div className="mb-6">
            {!selectedDate.start && !selectedDate.end ? (
              <div className="text-gray-400 italic">Silakan Pilih Tanggal</div>
            ) : (
              <DatePicker
                value={{ start: selectedDate.start, end: selectedDate.end }}
                onChange={(newDate) => setSelectedDate(newDate)}
              />
            )}
          </div>

          <div className="mb-4 flex items-center justify-between">
            <Link href="/pengaturan/staff">
              <Button variant="outline" className="flex items-center gap-1">
                <ChevronLeft className="h-4 w-4" />
                Kembali
              </Button>
            </Link>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/3">
                <div className="rounded-lg border p-6 shadow-lg flex flex-col items-center text-center min-h-[250px]">
                  <h3 className="text-lg font-semibold mb-0 uppercase">
                    {user.name}
                  </h3>
                  <p className="text-sm mb-2 font-medium text-gray-700">
                    {user.phone
                      ? String(user.phone).startsWith("0")
                        ? String(user.phone)
                        : `0${user.phone}`
                      : "-"}
                  </p>

                  <div className="w-full text-left mt-4 space-y-3 text-sm">
                    <div className="grid grid-cols-[120px_10px_1fr] items-center gap-y-1">
                      <span className="text-left font-medium">Email</span>
                      <span className="text-center">:</span>
                      <span>{user.email || "-"}</span>

                      <span className="text-left font-medium">Cabang</span>
                      <span className="text-center">:</span>
                      <span>
                        {Array.isArray(user.outlets)
                          ? user.outlets
                              .map((outlet: any) => outlet.name)
                              .join(", ")
                          : user.outlets}
                      </span>

                      <span className="text-left font-medium">Role</span>
                      <span className="text-center">:</span>
                      <span>{user.role || "-"}</span>

                      <span className="text-left font-medium">Status</span>
                      <span className="text-center">:</span>
                      <span
                        className={
                          user.status === 1 || user.status === "1"
                            ? "text-green-600 font-semibold"
                            : "text-red-600 font-semibold"
                        }
                      >
                        {user.status === 1 || user.status === "1"
                          ? "🟢 Aktif"
                          : "🔴 Tidak Aktif"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-2/3">
                <div className="mb-4 flex justify-between items-center">
                  <div className="md:ml-auto w-full md:w-1/2">
                    <Input
                      type="text"
                      placeholder="Cari Log Staff"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Waktu</TableHead>
                        <TableHead>Via</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead>Keterangan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedLogs.map((log, index) => (
                        <TableRow key={index}>
                          <TableCell>{log.time || "-"}</TableCell>
                          <TableCell>{log.via || "-"}</TableCell>
                          <TableCell>{log.mode || "-"}</TableCell>
                          <TableCell>{log.description || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {paginationMeta && (
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {paginationMeta.from} to {paginationMeta.to} of{" "}
                      {paginationMeta.total} entries
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

                      {(() => {
                        const totalPages = paginationMeta.last_page
                        const visiblePages: number[] = []

                        if (totalPages <= 3) {
                          for (let i = 1; i <= totalPages; i++) {
                            visiblePages.push(i)
                          }
                        } else {
                          if (currentPage === 1) {
                            visiblePages.push(1, 2, 3)
                          } else if (currentPage === totalPages) {
                            visiblePages.push(
                              totalPages - 2,
                              totalPages - 1,
                              totalPages
                            )
                          } else {
                            visiblePages.push(
                              currentPage - 1,
                              currentPage,
                              currentPage + 1
                            )
                          }
                        }

                        return visiblePages.map((page) => (
                          <Button
                            key={page}
                            variant={
                              currentPage === page ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => handlePageChange(page)}
                            className={
                              currentPage === page
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : ""
                            }
                          >
                            {page}
                          </Button>
                        ))
                      })()}

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
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
