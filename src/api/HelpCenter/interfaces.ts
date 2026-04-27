export interface IssueListParams {
  /**
   * 排序规则
   */
  order?: string
  /**
   * 页码
   */
  page?: number
  /**
   * 问题关键词
   */
  question?: string
  /**
   * 每页数量
   */
  size?: number
  /**
   * 排序字段
   */
  sort?: string
}

export interface IssueItem {
  id: number
  question: string
  answer: string
  [key: string]: any
}

export interface IssueListResponse {
  errno: number
  data: {
    total: number
    pages: number
    limit: number
    page: number
    list: IssueItem[]
  }
  errmsg: string
}
