declare type PagesRequest<T> = {
  total: number
  pages: number
  limit: number
  page: number
  list: T[]
}
