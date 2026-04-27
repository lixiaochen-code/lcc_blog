import { alovaInst } from '@/utils/request'
import type * as Types from './interfaces'

/**
 * 获取评论数量
 * @param params 请求参数
 */
export const getCommentCount = (params: Types.CommentCountParams) =>
  alovaInst.Get<any>('/wx/comment/count', { params })

/**
 * 获取评论列表
 * @param params 请求参数
 */
export const getCommentList = (params: Types.CommentListParams) =>
  alovaInst.Get<Types.CommentListResponse>('/wx/comment/list', { params })

/**
 * 获取评论列表1 (支持按门店/用户查询)
 * @param params 请求参数
 */
export const getCommentList1 = (params: Types.CommentList1Params) =>
  alovaInst.Get<Types.CommentListResponse>('/wx/comment/list1', { params })

/**
 * 发表评论
 * @param data 评论数据
 * @description type 2:门店
 */
export const postComment = (data: Types.PostCommentRequest) =>
  alovaInst.Post<any>('/wx/comment/post', data)
