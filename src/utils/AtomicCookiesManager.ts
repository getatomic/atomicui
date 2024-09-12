import { v4 as uuidv4 } from 'uuid'
let defaultClientCookieHandles: cookiesHandles
if (typeof window !== 'undefined') {
  // lazy load js-cookie to avoid SSR issues
  const Cookies = require('js-cookie')
  defaultClientCookieHandles = {
    getCookie(name?: string) {
      if (!name) {
        return Cookies.get()
      }
      return { "value": Cookies.get(name) } // use value to keep it consistent with server side
    },
    setCookie(name: string, value: string, options: any) {
      Cookies.set(name, value, options)
    },
    deleteCookie(name: string) {
      Cookies.remove(name)
    },
  }
  
}

interface cookieOptions {
  expires?: Date // Specifies the exact date when the cookie will expire.
  maxAge?: number // Sets the cookie’s lifespan in seconds.
  domain?: string // Specifies the domain where the cookie is available.
  path?: string // Limits the cookie's scope to a specific path within the domain.
  secure?: boolean // Ensures the cookie is sent only over HTTPS connections for added security.
  httpOnly?: boolean // Restricts the cookie to HTTP requests, preventing client-side access.
  sameSite?: boolean | 'lax' | 'strict' | 'none' // Controls the cookie's cross-site request behavior.
  priority?: 'low' | 'medium' | 'high' // Specifies the cookie's priority
  encode?: (value: string) => string // Specifies a function that will be used to encode a cookie's value.
  partitioned?: boolean // Indicates whether the cookie is partitioned.
}

/**
 * Different server-side frameworks use different cookie handling mechanisms.
 * This interface is used to abstract the differences between them and enforces a common API.
 */
export interface cookiesHandles {
  getCookie(name?: string): { [key: string]: string } | undefined
  setCookie(name: string, value: string, options?: any): void
  deleteCookie(name: string): void
}

const ATOMIC_USER_ID_COOKIE_NAME = 'atomic_uid'
const ATOMIC_SESSION_ID_COOKIE_NAME = 'atomic_sid'

export class AtomicCookiesManager {
  private cookieHandles: cookiesHandles

  constructor(cookies?: cookiesHandles) {
    if ((!cookies || !cookies.getCookie || !cookies.setCookie || !cookies.deleteCookie) && typeof window === 'undefined') {
      throw new Error('Cookies handles are required for atomic service to work on server side')
    } else if (!cookies && typeof window !== 'undefined') {
      this.cookieHandles = defaultClientCookieHandles
    } else if (cookies) {
      this.cookieHandles = cookies
    } else {
      throw new Error('Cookies handles are required for atomic service to work. If you are on client side, make sure that js-cookie is installed, if you are on server side, make sure to pass the cookies handles')
    }
  }

  getAtomicUserIdCookie() {
    return this.cookieHandles.getCookie(ATOMIC_USER_ID_COOKIE_NAME)?.value
  }

  getAtomicSessionIdCookie() {
    return this.cookieHandles.getCookie(ATOMIC_SESSION_ID_COOKIE_NAME)?.value
  }

  getVariantIdCookie(featureFlag: string, testEpoch: number) {
    const existingCookie = this.cookieHandles.getCookie(`atomic_${featureFlag}_${testEpoch}`)?.value
    return existingCookie
  }

  getSetAtomicUserIdCookie(userId?: string) {
    let atomicUserId = userId || this.cookieHandles.getCookie(ATOMIC_USER_ID_COOKIE_NAME)?.value
    if (!atomicUserId) {
      atomicUserId = uuidv4().toString()
      this.cookieHandles.setCookie(ATOMIC_USER_ID_COOKIE_NAME, atomicUserId, { maxAge: 60 * 60 * 24 * 365 * 100 })
    }
    return atomicUserId
  }

  getSetAtomicSessionIdCookie(sessionId?: string) {
    let atomicSessionId = sessionId || this.cookieHandles.getCookie(ATOMIC_SESSION_ID_COOKIE_NAME)?.value
    if (!atomicSessionId) {
      atomicSessionId = uuidv4().toString()
      this.cookieHandles.setCookie(ATOMIC_SESSION_ID_COOKIE_NAME, atomicSessionId)
    }
    return atomicSessionId
  }
}
