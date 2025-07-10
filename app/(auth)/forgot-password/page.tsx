"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft } from "lucide-react"
import mainLogo from "@/public/logo.svg"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      setError("Email harus diisi")
      return
    }

    setIsSubmitted(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-[400px] rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-6 flex justify-center">
          <div className="relative h-12 w-12">
            <Image
              src={mainLogo || "/placeholder.svg"}
              alt="Logo K"
              fill
              priority
              className="object-contain"
            />
          </div>
        </div>

        <h1 className="mb-2 text-center text-2xl font-semibold">
          Lupa Password
        </h1>

        {!isSubmitted ? (
          <>
            <p className="mb-6 text-center text-sm">
              Masukkan email Anda untuk menerima instruksi reset password
            </p>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Masukkan Email Anda"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Kirim Instruksi Reset
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center text-sm text-green-600 hover:underline"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Kembali ke Login
                </Link>
              </div>
            </form>
          </>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md bg-green-50 p-4 text-sm text-green-600">
              Instruksi reset password telah dikirim ke email Anda. Silakan
              periksa kotak masuk Anda.
            </div>
            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center text-sm text-green-600 hover:underline"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                Kembali ke Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
