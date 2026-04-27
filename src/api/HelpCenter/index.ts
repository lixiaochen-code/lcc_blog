import { alovaInst } from '@/utils/request'
import type * as Types from './interfaces'

/**
 * 获取帮助中心列表
 * @param params 查询参数
 */
export const getIssueList = (params?: Types.IssueListParams) =>
  alovaInst.Get<Types.IssueListResponse>('/wx/issue/list', {
    params,
  })
