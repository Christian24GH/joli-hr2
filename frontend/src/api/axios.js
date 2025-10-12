import axios from 'axios'

export const AUTH_API = axios.create({
  baseURL: import.meta.env.VITE_AUTH_BACKEND,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

export const FLEET_API = axios.create({
  baseURL: import.meta.env.VITE_FLEET_BACKEND,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});


/**
 * API HELPERS
 */
export async function login(credentials = {}) {
  await AUTH_API.post("/api/login", credentials, { withCredentials: true })
}

export async function logout() {
  const res = await AUTH_API.post("/api/logout", {}, { withCredentials: true })
  return res.data
}

export async function getUser() {
  const res = await AUTH_API.get("/api/user");
  return res.data;
}

// Get all users (for HR2 employee list)
export async function getUsers() {
  const res = await AUTH_API.get("/api/users");
  return res.data;
}

// Add other helpers as needed (register, etc)
export default AUTH_API;





