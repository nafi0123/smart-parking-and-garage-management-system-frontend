/**
 * Cookie Management Utility - Replaces localStorage completely for authentication & session storage
 */

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
  }
  return null;
}

export function setCookie(name: string, value: string, days = 7) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function deleteCookie(name: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}

export function getAuthToken(): string | null {
  return getCookie('accessToken');
}

export function getAuthUser(): any | null {
  const userStr = getCookie('user');
  if (!userStr || userStr === 'undefined' || userStr === 'null' || userStr.trim() === '') {
    return null;
  }
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: any) {
  setCookie('accessToken', token, 7);
  if (user) {
    setCookie('user', typeof user === 'string' ? user : JSON.stringify(user), 7);
  }
}

export function clearAuthSession() {
  deleteCookie('accessToken');
  deleteCookie('refreshToken');
  deleteCookie('user');
}
