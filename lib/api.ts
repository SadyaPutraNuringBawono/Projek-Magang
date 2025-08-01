import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("isLoggedIn")
      localStorage.removeItem("token")
      localStorage.removeItem("userEmail")
      localStorage.removeItem("outlet_id")

      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
    }

    return Promise.reject(error)
  },
)

export default api

