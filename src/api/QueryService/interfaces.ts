export interface ClearHistoryRequest {
  /**
   * userId
   */
  userId?: number
}

export interface HelperRequest {
  /**
   * keyword
   */
  keyword?: string
  /**
   * limit
   */
  limit?: number
  /**
   * page
   */
  page?: number
}

export interface IndexRequest {
  /**
   * userId
   */
  userId?: number
}

export type AnyResponse = any
