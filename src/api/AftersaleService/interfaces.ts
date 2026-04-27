export interface MallAftersale {
  addTime?: string
  aftersaleSn?: string
  amount?: number
  comment?: string
  deleted?: boolean
  handleTime?: string
  id?: number
  orderId?: number
  pictures?: string[]
  reason?: string
  status?: number
  type?: number
  updateTime?: string
  userId?: number
}

export interface CancelRequest {
  aftersale: MallAftersale
  userId?: number
}

export interface DetailParams {
  orderId?: number
  userId?: number
}

export interface ListParams {
  limit?: number
  order?: string
  page?: number
  sort?: string
  status: number
  userId?: number
}

export interface SubmitRequest {
  aftersale: MallAftersale
  userId?: number
}

export interface CommonResponse {
  [key: string]: any
}
