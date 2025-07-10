"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { useDispatch } from "react-redux"
import type { Dispatch } from "@/store"
import mainLogo from "@/public/logo.svg"

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    business_name: "",
    business_address: "",
    refferal: "",
    name: "",
    email: "",
    phone: "",
    password: "",
  })
  const router = useRouter()
  const dispatch = useDispatch<Dispatch>()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")
    setIsLoading(true)

    try {
      const result = await dispatch.auth.register(formData)

      if (result.success) {
        router.push("/login")
      } else {
        setErrorMessage(result.error || "Terjadi kesalahan saat mendaftar")
      }
    } catch (error: any) {
      setErrorMessage("Terjadi kesalahan saat mendaftar. Silakan coba lagi.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-[600px] rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-6 flex justify-center">
          <div className="relative h-10 w-10">
            <Image src={mainLogo || "/placeholder.svg"} alt="Logo K" fill priority className="object-contain" />
          </div>
        </div>

        <h1 className="mb-2 text-center text-2xl font-semibold">Daftar</h1>

        <p className="mb-6 text-center text-sm">
          Sudah Punya Akun?{" "}
          <Link href="/login" className="text-green-600 hover:underline">
            Masuk Di sini
          </Link>
        </p>

        {errorMessage && <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">{errorMessage}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Nama Lengkap
              </label>
              <Input id="name" placeholder="Nama Lengkap Anda" required onChange={handleChange} disabled={isLoading} />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                No. Whatsapp Aktif
              </label>
              <div className="flex">
                <div className="flex items-center rounded-l-md border border-r-0 bg-gray-50 px-3">+62</div>
                <Input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  pattern="\d*"
                  placeholder="81xxxxx"
                  className="rounded-l-none"
                  required
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Masukkan Email Anda"
                required
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan Password Anda"
                  required
                  className="pr-10"
                  onChange={handleChange}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="refferal" className="text-sm font-medium">
                Kode referral (Opsional)
              </label>
              <Input id="refferal" placeholder="Kode referral Anda" onChange={handleChange} disabled={isLoading} />
            </div>

            <div className="space-y-2">
              <label htmlFor="business_name" className="text-sm font-medium">
                Nama Usaha
              </label>
              <Input
                id="business_name"
                placeholder="Nama Usaha Anda"
                required
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="business_address" className="text-sm font-medium">
              Alamat usaha
            </label>
            <Input
              id="business_address"
              placeholder="Alamat Usaha Anda"
              required
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="terms" required disabled={isLoading} />
            <label htmlFor="terms" className="text-sm">
              Saya telah membaca dan menyetujui{" "}
              <Link href="/terms" className="text-blue-600 hover:underline">
                Syarat Ketentuan
              </Link>
              {" & "}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Kebijakan Privasi
              </Link>
            </label>
          </div>

          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
            {isLoading ? "Memproses..." : "Daftar Sekarang"}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">Copyright © Kasiran 2025 Version 1.0</p>
      </div>
    </div>
  )
}

