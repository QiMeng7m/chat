import type { ApiErrorBody } from './types.ts'

const TOKEN_KEY = 'accessToken'

export class ApiError extends Error {
  readonly code: string
  readonly status: number
  readonly details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setAccessToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearAccessToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export async function parseApiError(res: Response): Promise<ApiError> {
  let code = 'INTERNAL_ERROR'
  let message = res.statusText || '请求失败'
  let details: unknown

  try {
    const body = (await res.json()) as ApiErrorBody
    if (body.error) {
      code = body.error.code
      message = body.error.message
      details = body.error.details
    }
  } catch {
    // 非 JSON 响应
  }

  return new ApiError(res.status, code, message, details)
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  auth?: boolean
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = true, headers: initHeaders, ...rest } = options

  const headers = new Headers(initHeaders)

  if (body !== undefined && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (auth) {
    const token = getAccessToken()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  const res = await fetch(path, {
    ...rest,
    headers,
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  })

  if (res.status === 204) {
    return undefined as T
  }

  if (!res.ok) {
    throw await parseApiError(res)
  }

  return res.json() as Promise<T>
}
