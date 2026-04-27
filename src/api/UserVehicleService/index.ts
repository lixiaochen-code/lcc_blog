import { alovaInst } from '@/utils/request'
import type * as Types from './interfaces'

/**
 * 获取默认车辆信息
 * @param params 请求参数
 */
export const findDefault = (params?: Types.FindDefaultParams) =>
  alovaInst.Get<Types.FindDefaultResponse>('/wx/vehicles/default', {
    params,
  })

/**
 * 删除车辆信息
 * @param id 车辆ID
 * @param data 请求体参数
 */
export const deleteVehicle = (id: number, data?: { userId?: number }) =>
  alovaInst.Post<Types.DeleteResponse>(`/wx/vehicles/delete/${id}`, data)

/**
 * 获取车辆详情
 * @param id 车辆ID
 * @param params 请求参数
 */
export const getDetail = (id: number, params?: { userId?: number }) =>
  alovaInst.Get<Types.DetailResponse>(`/wx/vehicles/detail/${id}`, {
    params,
  })

/**
 * 获取车辆列表
 * @param params 请求参数
 */
export const getList = (params?: Types.ListParams) =>
  alovaInst.Get<Types.ListResponse>('/wx/vehicles/list', {
    params,
  })

/**
 * 保存车辆信息
 * @param data 车辆保存对象
 */
export const saveVehicle = (data: Types.SaveParams) =>
  alovaInst.Post<Types.SaveResponse>('/wx/vehicles/save', data)

/**
 * 店员修改车辆信息
 * @param data 车辆编辑对象
 */
export const editVehicle = (data: Types.EditParams) =>
  alovaInst.Post<Types.EditResponse>('/wx/vehicles/edit', data)
