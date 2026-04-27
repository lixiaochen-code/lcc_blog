import { alovaInst } from '@/utils/request'
import type * as Types from './interfaces'

/**
 * 取消订单
 * @param data 请求体参数
 */
export const cancelOrder = (data: Types.OrderActionBody) =>
  alovaInst.Post<any>('/wx/car/order/cancel', data)

/**
 * 1.车辆服务下单(用户)
 * @param data 下单参数
 */
export const submitCarOrder = (data: Types.OrderCreateVO) =>
  alovaInst.Post<{
    orderId: number
  }>('/wx/car/order/car_submit', data)

/**
 * 评论
 * @param data 评论参数
 */
export const commentOrder = (data: Types.OrderActionBody) =>
  alovaInst.Post<any>('/wx/car/order/comment', data)

/**
 * 7.确认完成(用户)
 * @param data 确认参数
 */
export const confirmOrder = (data: Types.OrderActionBody) =>
  alovaInst.Post<any>('/wx/car/order/confirm', data)

/**
 * 3.确认收款(线下-店员)
 * @param data 收款确认参数
 */
export const confirmPayment = (data: Types.OrderEventVO) =>
  alovaInst.Post<any>('/wx/car/order/confirm_payment', data)

/**
 * 删除订单
 * @param data 删除参数
 */
export const deleteOrder = (data: Types.OrderActionBody) =>
  alovaInst.Post<any>('/wx/car/order/delete', data)

/**
 * 订单详情
 * @param params orderId
 */
export const getOrderDetail = (params: { orderId: number; userId?: number }) =>
  alovaInst.Get<Types.OrderListItem>('/wx/car/order/detail', { params, cacheFor: 0 })

/**
 * 根据订单编码获取订单
 * @param params orderSn
 */
export const getOrderDetailBySn = (params: { orderSn: string }) =>
  alovaInst.Get<any>('/wx/car/order/detailBySn', { params, cacheFor: 0 })

/**
 * 4.派遣服务技师(店长或派遣)
 * @param data 派遣参数
 */
export const dispatchOrder = (data: Types.DispatchOrderVO & { userId?: number }) =>
  alovaInst.Post<any>('/wx/car/order/dispatch', data)

/**
 * 6.结束服务(技师)
 * @param data 结束服务参数
 */
export const endService = (data: Types.OrderEventVO) =>
  alovaInst.Post<any>('/wx/car/order/end_service', data)

/**
 * 查询订单列表
 * @param params 查询参数
 */
export const getOrderList = (params: Types.OrderListParams & { userId?: number }) =>
  alovaInst.Get<Types.OrderListResponse>('/wx/car/order/list', { params, cacheFor: 0 })

/**
 * 2.核销二维码(店员)
 * @param data 核销参数
 */
export const checkQrCode = (data: Types.OrderEventVO) =>
  alovaInst.Post<any>('/wx/car/order/qr_code_check', data)

/**
 * 获取服务类型列表
 * @param params type
 */
export const getServiceTypes = (params: { type: number; userId?: number }) =>
  alovaInst.Get<any>('/wx/car/order/services', { params })

/**
 * 5.开始服务(技师)
 * @param data 开始服务参数
 */
export const startService = (data: Types.OrderEventVO) =>
  alovaInst.Post<any>('/wx/car/order/start_service', data)

/**
 * 统计总额度
 * @param params 统计参数
 */
export const getSumMoney = (params: Types.OrderListParams & { userId?: number }) =>
  alovaInst.Get<any>('/wx/car/order/sumMoney', { params })

/**
 * 店员首页
 */
export const getStaffHome = (data: { userId?: number }) =>
  alovaInst.Post<Types.StaffHomeResponse>('/wx/car/order/staff_home', data, {
    cacheFor: null,
  })

/**
 * 店员-我的
 */
export const getStaffMine = (data: { userId?: number }) =>
  alovaInst.Post<any>('/wx/car/order/staff_mine', data)

/**
 * 获取可派遣店员列表
 * @param params DispatchableStaffParams
 * @returns alovaInst.Get<Types.DispatchableStaffResponse>
 */
export const getDispatchableStaffList = (params: Types.DispatchableStaffParams) =>
  alovaInst.Get<Types.DispatchableStaffResponse>('/wx/car/order/order_staff_list', {
    params,
  })

/**
 * 上传图片(涉及到订单的店员都可以上传图片知道订单完成)
 * @param {Types.AddEventRequestVO} data 请求体参数
 */
export const addOrderEvent = (data: Types.AddEventRequestVO) =>
  alovaInst.Post<any>('/wx/car/order/addEvent', data)

/**
 * 店长取消订单
 * @param data 取消参数
 * TODO: 待后端接口上线后确认 URL
 */
export const staffCancelOrder = (data: Types.OrderActionBody) =>
  alovaInst.Post<any>('/wx/car/order/staff_cancel', data)

/**
 * 获取预约时间范围
 * @param params 查询参数，storeServiceId为必填
 * @returns 可预约的日期和时间段列表
 */
export const getAppointmentTimeRange = (params: Types.AppointmentTimeRangeParams) =>
  alovaInst.Get<Types.DailySchedule[]>('/wx/car/order/get_appointment_time_range', {
    params,
    cacheFor: 0,
  })

/**
 * 拉黑用户并删除订单
 * @param data 请求参数
 */
export const addBlockAndDeleteOrder = (data: Types.OrderEventVO) =>
  alovaInst.Post<any>('/wx/car/order/add_black_list', data)

/**
 * 店长修改预约时间
 * @param data 修改参数
 */
export const staffUpdateTime = (data: Types.StaffUpdateTimeVO) =>
  alovaInst.Post<any>('/wx/car/order/update_time', data)
