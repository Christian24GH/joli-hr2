import { createContext, useState, useEffect } from "react";
import api, { login as apiLogin, logout as apiLogout } from "../api/axios";
import { toast } from "sonner";
import { useNavigate } from "react-router";

const AuthContext = createContext({})
export const AuthProvider = ({ children }) => {
  const env = import.meta.env.VITE_AUTH_BACKEND
  //console.log("AuthProvider using backend: " + env)
  const [auth, setAuth] = useState(null)
  const [loading, setLoading] = useState(true)

  // always fetch user from backend if cookie exists
  const fetchUser = async () => {
    try {
      const response = await api.get("/api/user", { withCredentials: true })
      setAuth(response.data)
      return response.data
    } catch (error) {
      setAuth(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  const logout = async () => {
    try {
      await apiLogout()
    } catch (_) {
      // ignore errors
    } finally {
      setAuth(null)
      window.location.href = `${import.meta.env.VITE_LANDING_FRONTEND}/login`
    }
  }

  return (
    <AuthContext.Provider value={{ auth, setAuth, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
