import { createModel } from "@rematch/core"
import type { RootModel } from "."
import axios from "axios"

type User = {
  email: string
  token: string
}

type AuthState = {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

export const auth = createModel<RootModel>()({
  state: {
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
  } as AuthState,
  reducers: {
    setUser(state, payload: User) {
      return {
        ...state,
        user: payload,
        isAuthenticated: true,
        loading: false,
        error: null,
      }
    },
    setLoading(state, payload: boolean) {
      return {
        ...state,
        loading: payload,
      }
    },
    setError(state, payload: string) {
      return {
        ...state,
        error: payload,
        loading: false,
      }
    },
    logout(state) {
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        error: null,
      }
    },
  },
  effects: (dispatch) => ({
    async login(payload: { email: string; password: string }) {
      try {
        dispatch.auth.setLoading(true)

        // const response = await axios.post('/api/auth/login', payload)
        // const { user, token } = response.data

        if (payload.password === "admin") {
          const user = {
            email: payload.email,
            token: "demo-token-12345",
          }

          axios.defaults.headers.common["Authorization"] = `Bearer ${user.token}`

          localStorage.setItem("token", user.token)
          localStorage.setItem("userEmail", user.email)
          localStorage.setItem("isLoggedIn", "true")

          dispatch.auth.setUser(user)
          return true
        } else {
          dispatch.auth.setError("login error! email atau password salah")
          return false
        }
      } catch (error) {
        dispatch.auth.setError("login error! email atau password salah")
        return false
      }
    },
    async register(payload: any) {
      try {
        dispatch.auth.setLoading(true)

        const user = {
          email: payload.email,
          token: "demo-token-12345",
        }

        axios.defaults.headers.common["Authorization"] = `Bearer ${user.token}`

        localStorage.setItem("token", user.token)
        localStorage.setItem("userEmail", user.email)
        localStorage.setItem("isLoggedIn", "true")

        dispatch.auth.setUser(user)
        return true
      } catch (error) {
        dispatch.auth.setError("Registration failed")
        return false
      }
    },
    async checkAuth() {
      const token = localStorage.getItem("token")
      const email = localStorage.getItem("userEmail")

      if (token && email) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`

        dispatch.auth.setUser({
          email,
          token,
        })
        return true
      }
      return false
    },
    async logoutUser() {
      localStorage.removeItem("token")
      localStorage.removeItem("userEmail")
      localStorage.removeItem("isLoggedIn")

      delete axios.defaults.headers.common["Authorization"]

      dispatch.auth.logout()
      return true
    },
  }),
})

