type CachedJwt = {
  token: string
  expMs: number
}

let cachedJwt: CachedJwt | null = null

export function peekCachedJwt(): CachedJwt | null {
  return cachedJwt
}

export function setCachedJwt(token: string, expMs: number): void {
  cachedJwt = { token, expMs }
}

export function clearCachedJwt(): void {
  cachedJwt = null
}
