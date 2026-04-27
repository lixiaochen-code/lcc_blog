export interface BaseResponse<T> {
  code: number
  message: string
  data: T
}

export interface CarMallWxInfo {
  id: string
  name: string
  description?: string
  version: string
}
