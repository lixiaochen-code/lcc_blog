export interface BrandDetailParams {
  /**
   * id
   */
  id?: number
}

export interface BrandListParams {
  /**
   * limit
   */
  limit?: number
  /**
   * order
   */
  order?: string
  /**
   * page
   */
  page?: number
  /**
   * sort
   */
  sort?: string
}

export interface TopicDetailParams {
  /**
   * id
   */
  id?: number
  /**
   * userId
   */
  userId?: number
}

export interface TopicListParams {
  /**
   * limit
   */
  limit?: number
  /**
   * order
   */
  order?: string
  /**
   * page
   */
  page?: number
  /**
   * sort
   */
  sort?: string
}

export interface TopicRelatedParams {
  /**
   * id
   */
  id?: number
}

export interface ApiResponse<T = any> {
  errno: number
  errmsg: string
  data: T
}
