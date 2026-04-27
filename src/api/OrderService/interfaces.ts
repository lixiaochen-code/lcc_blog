export { OrderStatus, OrderStatusMap, OrderStatusColorMap } from '@/enums/order'
import { OrderStatus } from '@/enums/order'
import type { MallComment } from '@/api/Comment/interfaces'

type TagType = 'error' | 'warning' | 'primary' | 'success' | 'info'

/** orderStatus → 显示文本 + 标签颜色 + 自定义颜色 */
export const ORDER_STATUS_CONFIG: Record<
  number,
  { text: string; tagType: TagType; color: string }
> = {
  [OrderStatus.CREATE]: { text: '待付款', tagType: 'warning', color: '#ff9900' },
  [OrderStatus.USER_CANCEL]: { text: '已取消', tagType: 'info', color: '#909399' },
  [OrderStatus.CANCEL]: { text: '已取消', tagType: 'info', color: '#909399' },
  [OrderStatus.CHECKED]: { text: '已到店', tagType: 'success', color: '#19be6b' },
  [OrderStatus.PAY]: { text: '已支付', tagType: 'primary', color: '#2979ff' },
  [OrderStatus.SHIP]: { text: '服务中', tagType: 'error', color: '#fa3534' },
  [OrderStatus.SERVICE_COMPLETED]: { text: '待确认', tagType: 'warning', color: '#f56c6c' },
  [OrderStatus.CONFIRM]: { text: '已完成', tagType: 'success', color: '#19be6b' },
  [OrderStatus.AUTO_CONFIRM]: { text: '系统自动完成', tagType: 'success', color: '#19be6b' },
  [OrderStatus.STAFF_CANCEL]: { text: '已取消', tagType: 'info', color: '#909399' },
  [OrderStatus.ADMIN_CANCEL]: { text: '已取消', tagType: 'info', color: '#909399' },
  [OrderStatus.UPDATE_TIME]: { text: '修改预约时间', tagType: 'warning', color: '#ff9900' },
}

const DEFAULT_STATUS = { text: '未知', tagType: 'info' as TagType, color: '#909399' }

/** 根据 orderStatus 获取显示配置 */
export const getOrderStatusConfig = (status?: number) =>
  ORDER_STATUS_CONFIG[status!] ?? DEFAULT_STATUS

export const getOrderDisplayStatusConfig = (order?: {
  orderStatus?: number
  payed?: number | boolean
}) => {
  if (
    (order?.payed === 1 || order?.payed === true) &&
    [OrderStatus.CREATE, OrderStatus.CHECKED, OrderStatus.PAY].includes(
      order?.orderStatus as OrderStatus
    )
  ) {
    return ORDER_STATUS_CONFIG[OrderStatus.PAY]
  }
  return getOrderStatusConfig(order?.orderStatus)
}

export interface OrderStaffItem {
  id: number
  orderId: number
  staffId: number
  userId: number
  serviceCode: string
  storeServicesId: number
  name: string
  phone: string
  avatarUrl: string
  role: string
  status: number
  addTime: string
  updateTime: string
  deleted: boolean
}

export interface OrderEventInfoItem {
  id: number
  orderId: number
  storeId: number
  serverCode?: string
  storeServicesId: number
  orderEventType: number
  eventUserId: number
  orderStatus: number
  addTime: string
  updateTime: string
  gender: number
  userLevel: number
  nickname: string
  mobile: string
  avatar: string
  roleName?: string
  remark?: string
  picUrls?: string
  extra?: string
}

export interface OrderHandleOption {
  /**上传图片 */
  upload: true
  /**取消订单 */
  cancel: false
  /**删除订单 */
  delete: false
  /**核销 */
  check: false
  /**确认收款 */
  payed: false
  /**开始服务 */
  startService: false
  /**结束服务 */
  endService: false
  /**派遣员工 */
  dispatch: false
  /**评价 */
  comment: false
  /**确认完成 */
  confirm: false
  /**退款 */
  refund: false
  /**再来一单 */
  rebuy: false
  /**售后 */
  aftersale: false
  /** 查看二维码 */
  showQrCode: false
  /** 店长取消订单 */
  staffCancel: false
  /** 拉黑并删除 */
  addBlockAndDelete: false
  /** 店长修改预约时间 */
  staffUpdateTime: false
  /** 店员修改车辆信息 */
  staffUpdateVehicle?: boolean
}
export interface OrderVehicleItem {
  id: number
  orderId: number
  serviceCode: string
  storeServicesId: number
  userId: number
  licensePlate: string
  callName?: string
  phone?: string
  brand?: string
  model?: string
  color?: string
  coverUrl?: string
  addTime: string
  updateTime: string
  deleted: boolean
}

export interface OrderListItem {
  qrCodeUrl: string
  isCheck: number
  orderType: number
  eventList: OrderEventInfoItem[]
  addTime: string
  serviceCode: string
  orderSn: string
  actualPrice: number
  payTime: string
  payed?: number | boolean
  orderStatus: number
  grouponPrice: number
  payType: number
  appointmentTime: string
  userMobile: string
  orderPrice: number
  id: number
  freightPrice: number
  integralPrice: number
  storeServicesId: number
  consignee: string
  address: string
  comments: number
  mobile: string
  phone?: string
  callName?: string
  updateTime: string
  staff: OrderStaffItem[]
  avatar: string
  storeId: number
  storeInfo?: {
    name?: string
    picUrl?: string
  }
  serviceName: string
  message: string
  userName: string
  userId: number
  aftersaleStatus: number
  goodsPrice: number
  couponPrice: number
  payId: string
  handleOption: OrderHandleOption
  vehicles?: OrderVehicleItem
  comment?: MallComment
}

export type OrderListResponse = PagesRequest<OrderListItem>

export interface CommonBody {
  body: string
  userId?: number
}

/** 充值订单创建参数 */
export interface OrderCreateVO {
  /** 预约时间 */
  appointmentTime: string
  /** 支付方式 1:现金支付 2:抵扣卷支付 3:现金支付 */
  payType: number
  serviceCode?: string
  /** 门店ID */
  storeId: number
  /** 门店服务ID */
  storeServiceId: number
  /** 用户id */
  userId: number
  /** 车辆id */
  vehiclesId: number
  /** 车牌号 */
  licensePlate?: string
  /** 车主称呼 */
  callName?: string
  /** 联系电话 */
  phone?: string
}

/** 订单事件信息 */
export interface OrderEventVO {
  /** 补充信息,通常为json 例如{\"time\":\"2026-01-01\"} */
  extra?: string
  /** 订单编号 */
  orderId?: number
  /** 上传图片 */
  picUrls?: string
  /** 备注 */
  remark?: string
}

/** 修改订单时间 */
export interface StaffUpdateTimeVO extends OrderEventVO {
  /** 预约时间 */
  time?: string
}

/** 店员 */
export interface Staff {
  avatarUrl?: string
  id?: number
  name?: string
  phone?: string
  role?: string
  storeId?: number
  userId?: number
}

/** 指派人员订单 */
export interface DispatchOrderVO {
  /** 预计开始时间 */
  estimateTime?: string
  /** 补充信息,通常为json 例如{\"time\":\"2026-01-01\"} */
  extra?: string
  /** 订单编号 */
  orderId?: number
  /** 上传图片 */
  picUrls?: string
  /** 备注 */
  remark?: string
  /** 人员列表 */
  staffList?: Staff[]
}

/** 订单列表查询参数 */
export interface OrderListParams {
  /** 售后服务状态 */
  aftersaleStatus?: number
  /** 收货人姓名(模糊查询) */
  consignee?: string
  /** 订单创建结束时间 */
  endTime?: string
  /** 收货人电话 */
  mobile?: string
  /** 月份(格式例如 2022-12 2022-01 确保为7位) */
  month?: string
  /** 订单编号 */
  orderSn?: string
  /** 订单状态 多个请用,隔开 */
  orderStatus?: string
  /** 订单类别 1:车辆服务 */
  orderType?: string
  /** 页码 */
  pageNumber?: number
  /** 条数(传0表示不分页) */
  pageSize?: number
  /** 服务编码 */
  serviceCode?: string
  /** 订单创建开始时间 */
  startTime?: string
  /** 订单类型分类 1:已下单 2:等待服务 3:服务中 4:服务完成 5:订单完成 */
  stateType?: number
  /** 门店id */
  storeId?: number
  /** 用户等级 */
  userLevel?: number
}

// ========== 店员首页 ==========
// 探测响应示例:
// { "toDoList": [{ "orderId": 52, "eventName": "未开始", "time": "" }],
//   "toDoCount": 1, "confirmTotalToDay": 1, "totalToDay": 2 }

/** 店员首页 - 待办事项 */
export interface StaffHomeToDoItem {
  /** 订单ID */
  orderId: number
  /** 订单编号 */
  orderSn?: string
  /** 订单编号（后端兼容字段） */
  ordersn?: string
  /** 服务名称 */
  serviceName?: string
  /** 车辆图片 */
  vehiclespicUrl?: string
  /** 车辆图片（兼容驼峰字段） */
  vehiclesPicUrl?: string
  /** 车牌号 */
  vehiclesLicensePlate?: string
  /** 车主称呼 */
  callName?: string
  /** 联系电话 */
  phone?: string
  /** 时间标签 */
  timeLabel?: string
  /** 事件名称，如"未开始" */
  eventName: string
  /** 预计时间 */
  time: string
}

/** 店员首页响应 */
export interface StaffHomeResponse {
  /** 待办事项列表 */
  toDoList: StaffHomeToDoItem[]
  /** 待办数量 */
  toDoCount: number
  /** 今日已完成数 */
  confirmTotalToDay: number
  /** 今日订单总数 */
  totalToDay: number
}

/** 取消订单/评论/确认完成/删除订单通用请求体 */
export interface OrderActionBody {
  orderId?: number
  content?: string
  star?: number
  hasPicture?: boolean
  picUrls?: string[]
  orderSn?: string
  remark?: string
}

/** 订单事件信息 */
export interface OrderEventInfo {
  /** 补充信息,通常为json 例如{\"time\":\"2026-01-01\"} */
  extra?: string
  /** 订单编号 */
  orderId?: number
  /** 上传图片 */
  picUrls?: string
  /** 备注 */
  remark?: string
}

/** 充值订单创建参数 */
export interface CreateOrderVO {
  /** 预约时间 */
  appointmentTime: string
  /** 支付方式 1:现金支付 2:抵扣卷支付 3:现金支付 */
  payType: number
  serviceCode?: string
  /** 门店ID */
  storeId: number
  /** 门店服务ID */
  storeServiceId: number
  /** 用户id */
  userId: number
  /** 车辆id */
  vehiclesId: number
  /** 车牌号 */
  licensePlate?: string
  /** 车主称呼 */
  callName?: string
  /** 联系电话 */
  phone?: string
}

export interface DispatchableStaffParams {
  /**
   * orderId
   */
  orderId: number
  /**
   * userId
   */
  userId?: number
}

/** 可派遣员工 - 真实响应字段 */
export interface DispatchableStaffItem {
  id: number
  storeId: number
  userId: number
  name: string
  phone: string
  role: string
  workStatus: number
  avatarUrl?: string
  addTime: string
  updateTime: string
  deleted: boolean
}

export type DispatchableStaffResponse = PagesRequest<DispatchableStaffItem>

export interface AddEventRequestVO {
  /**
   * 补充信息,通常为json 例如{"time":"2026-01-01"}
   */
  extra?: string
  /**
   * 订单编号
   */
  orderId?: number
  /**
   * 上传图片
   */
  picUrls?: string
  /**
   * 备注
   */
  remark?: string
}

// ========== 店员/店长 我的页面 ==========
/** 统计项 */
export interface StaffMineStatItem {
  /** 数值 */
  number: number
  /** 名称 */
  name: string
}

/** 店员我的页面响应 */
export interface StaffMineResponse {
  /** 累计统计 (订单数、总金额、评分) */
  toDoCount: StaffMineStatItem[]
  /** 今日统计 (订单数、总金额、评分) */
  today: StaffMineStatItem[]
}

// ========== 预约时间接口 ==========

/** 时间段定义 */
export interface TimeScope {
  /** 开始时间，格式: HH:mm */
  startTime: string
  /** 结束时间，格式: HH:mm */
  endTime: string
  /** 是否可用 */
  valid: boolean
  /** 是否可被选中（工位时间轴模式） */
  selectEnable?: boolean
  /** 持续时间（分钟） */
  durationMinutes: number
}

/** 每日排班信息 */
export interface DailySchedule {
  /** 日期，格式: yyyy-MM-dd */
  date: string
  /** 已预约时间段 */
  orderTimeScope: TimeScope[]
  /** 空闲时间段 */
  freeTimeScope: TimeScope[]
  /** 按工位分组的时间段，每个子数组代表一个工位 */
  timelineGroup?: TimeScope[][]
  /** 营业时间段 */
  businessTimeScope: TimeScope[]
}

/** 预约时间查询参数 */
export interface AppointmentTimeRangeParams {
  /** 门店服务ID (必填) */
  storeServiceId: number
}
