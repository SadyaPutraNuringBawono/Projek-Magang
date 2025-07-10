"use client"

import type { ReactNode } from "react"
import { Provider } from "react-redux"
import { store } from "@/store"
import { AuthProvider } from "./auth-provider"
import { ThemeProvider } from "./theme-provider"

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </Provider>
  )
}

