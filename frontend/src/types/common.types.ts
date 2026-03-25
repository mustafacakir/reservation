export interface PagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ApiError {
  status: number
  message: string
  errors?: string[]
}
