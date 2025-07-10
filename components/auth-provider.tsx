"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useDispatch, useSelector } from "react-redux"
import type { Dispatch, RootState } from "@/store"

type AuthContextType = {
  user: any
  isLoggedIn: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  userEmail: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const dispatch = useDispatch<Dispatch>()
  const { isLoggedIn, userEmail } = useSelector((state: RootState) => state.auth)
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    // Check if user is logged in on component mount
    const loggedIn = localStorage.getItem("isLoggedIn") === "true"
    const email = localStorage.getItem("userEmail")
    const token = localStorage.getItem("token")
    const outletId = localStorage.getItem("outlet_id")

    if (loggedIn && email && token && outletId) {
      dispatch.auth.loginSuccess({
        token, userEmail: email, outletId,
        companyId: ""
      })
    }

    setInitialized(true)
  }, [dispatch.auth])

  const login = async (email: string, password: string) => {
    return await dispatch.auth.login({ email, password })
  }

  const logout = () => {
    dispatch.auth.logoutAction()
    router.push("/login")
  }

  if (!initialized) {
    return null
  }

  return <AuthContext.Provider value={{ user: null, isLoggedIn, login, logout, userEmail }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

