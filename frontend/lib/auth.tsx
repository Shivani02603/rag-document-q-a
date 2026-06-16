export function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  return localStorage.getItem('token')
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') {
    return
  }
  localStorage.setItem('token', token)
}

export function removeToken(): void {
  if (typeof window === 'undefined') {
    return
  }
  localStorage.removeItem('token')
}

export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  const token = localStorage.getItem('token')
  if (!token) return false
  
  try {
    const payload = parseJwt(token)
    if (!payload || !payload.exp) return false
    return Date.now() < payload.exp * 1000
  } catch {
    return false
  }
}

export function getUser(): { id: string; email: string; name: string } | null {
  if (typeof window === 'undefined') {
    return null
  }
  const token = localStorage.getItem('token')
  if (!token) return null
  
  try {
    const payload = parseJwt(token)
    return {
      id: payload.sub || payload.id || '',
      email: payload.email || '',
      name: payload.name || '',
    }
  } catch {
    return null
  }
}

export function parseJwt(token: string): any {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Failed to parse JWT:', error)
    return null
  }
}