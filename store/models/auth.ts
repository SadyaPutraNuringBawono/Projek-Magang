import api from "@/lib/api"

export type AuthState = {
  isLoggedIn: boolean
  token: string | null
  userEmail: string | null
  companyId: string | null
  outletId: string | null
  loading: boolean
  error: string | null
}

export const auth = {
  state: {
    isLoggedIn: false,
    token: null,
    userEmail: null,
    companyId: null,
    outletId: null,
    loading: false,
    error: null,
  } as AuthState,

  reducers: {
    setLoading(state: AuthState, loading: boolean) {
      return { ...state, loading, error: null }
    },

    setError(state: AuthState, error: string) {
      return { ...state, error, loading: false }
    },

    loginSuccess(
      state: AuthState,
      payload: {
        token: string
        userEmail: string
        outletId: string
        companyId: string
      }
    ) {
      return {
        ...state,
        isLoggedIn: true,
        token: payload.token,
        userEmail: payload.userEmail,
        companyId: payload.companyId,
        outletId: payload.outletId,
        loading: false,
        error: null,
      }
    },

    logout(state: AuthState) {
      return {
        ...state,
        isLoggedIn: false,
        token: null,
        userEmail: null,
        outletId: null,
      }
    },
  },

  effects: (dispatch: any) => ({
    async login({ email, password }: { email: string; password: string }) {
      dispatch.auth.setLoading(true)

      try {
        const response = await api.post("/v1/app/auth/login", {
          email,
          password,
        })

        const { token, outlets, company } = response.data.data
        const outletId = outlets[0].id
        const companyId = company.id

        // if (typeof window !== 'undefined') {
          localStorage.setItem(
            "auth",
            JSON.stringify({
              isLoggedIn: true,
              token,
              userEmail: email,
              outletId,
              companyId,
            })
          )
          localStorage.setItem("outlet_id", outletId)
          localStorage.setItem("userEmail", email)
          localStorage.setItem("token", token)
          localStorage.setItem("companyId", companyId)
          document.cookie = "isLoggedIn=true; path=/; max-age=86400"

          dispatch.auth.loginSuccess({
            token,
            userEmail: email,
            outletId,
            companyId,
          })
        // }
        return { success: true }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          "Login gagal! Email atau kata sandi salah."
        dispatch.auth.setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    },

    async register(userData: any) {
      dispatch.auth.setLoading(true)

      try {
        await api.post("/v1/app/auth/register", {
          business_name: userData.business_name,
          business_address: userData.business_address,
          refferal: userData.refferal,
          name: userData.name,
          email: userData.email,
          phone: Number(userData.phone),
          password: userData.password,
        })

        return { success: true }
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message ||
          "Terjadi kesalahan saat mendaftar. Silakan coba lagi."
        dispatch.auth.setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    },

    async logoutAction() {
      localStorage.removeItem("auth")
      document.cookie = "isLoggedIn=false; path=/; max-age=0"

      dispatch.auth.logout()
    },
  }),
}
