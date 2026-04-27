export interface MallComment {
  addTime?: string
  adminContent?: string
  content?: string
  deleted?: boolean
  hasPicture?: boolean
  id?: number
  orderId?: number
  picUrls?: string[]
  star?: number
  type?: number
  updateTime?: string
  userId?: number
  valueId?: number
}

export interface CommentCountParams {
  type?: number
  valueId?: number
}

export interface CommentListParams {
  /** 1好评 2中评 3差评 */
  level?: number
  limit?: number
  orderId?: number
  page?: number
  showType?: number
  type: number
  valueId: number
}

export interface CommentList1Params {
  limit?: number
  orderId?: number
  page?: number
  storeId?: number
  /** 评论类型 2:门店 */
  type?: number
  userId?: number
}

export interface PostCommentRequest {
  comment: MallComment
  userId?: number
}

/** 评论列表项 */
export interface CommentListItem {
  id: number
  userId: number
  type: number
  content: string
  star: number
  hasPicture: boolean
  picUrl: string
  picUrls?: string[]
  adminContent: string
  addTime: string
  updateTime: string
  orderId?: number
  valueId?: number
  /** 用户昵称 (部分接口返回) */
  nickname?: string
  /** 用户头像 (部分接口返回) */
  avatar?: string
  /** 店铺名称 */
  objName?: string
  /** 店铺ID */
  storeId?: string
  storePicUrl?: string
}

/** 评论列表响应 */
export interface CommentListResponse {
  total: number
  pages: number
  limit: number
  page: number
  list: CommentListItem[]
}
