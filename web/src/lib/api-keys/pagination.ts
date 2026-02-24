import { NextResponse } from 'next/server'

export const DEFAULT_LIMIT = 50
export const MAX_LIMIT = 200

export function parsePagination(url: URL): { limit: number; offset: number } {
  const limitParam = url.searchParams.get('limit')
  const offsetParam = url.searchParams.get('offset')

  let limit = limitParam ? parseInt(limitParam, 10) : DEFAULT_LIMIT
  let offset = offsetParam ? parseInt(offsetParam, 10) : 0

  if (isNaN(limit) || limit < 1) limit = DEFAULT_LIMIT
  if (limit > MAX_LIMIT) limit = MAX_LIMIT
  if (isNaN(offset) || offset < 0) offset = 0

  return { limit, offset }
}

export function apiSuccess<T>(data: T[], total: number, limit: number, offset: number) {
  return NextResponse.json({ data, meta: { total, limit, offset } })
}

export function apiError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status })
}
