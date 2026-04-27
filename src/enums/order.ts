/**
 * 订单状态
 */
export enum OrderStatus {
  /** 创建订单 */
  CREATE = 101,
  /** 取消订单 */
  USER_CANCEL = 102,

  /** 取消订单 */
  CANCEL = 103,

  /** 店长取消订单 */
  STAFF_CANCEL = 105,

  /** 管理员取消订单 */
  ADMIN_CANCEL = 106,

  /** 核销二维码 */
  CHECKED = 104,

  /** 确认收款 */
  PAY = 201,

  /** 开始服务 */
  SHIP = 301,

  /** 完成服务 */
  SERVICE_COMPLETED = 302,

  /** 确认完成 */
  CONFIRM = 401,

  /** 确认完成(系统自动) */
  AUTO_CONFIRM = 402,

  /** 修改预约时间 */
  UPDATE_TIME = 3,
}

/**
 * 状态映射文案（用于 UI 展示）
 */
export const OrderStatusMap: Record<number, string> = {
  [OrderStatus.CREATE]: '待付款',
  [OrderStatus.CANCEL]: '已取消',
  [OrderStatus.USER_CANCEL]: '已取消',
  [OrderStatus.CHECKED]: '已到店',
  [OrderStatus.PAY]: '已支付',
  [OrderStatus.SHIP]: '服务中',
  [OrderStatus.SERVICE_COMPLETED]: '待确认',
  [OrderStatus.CONFIRM]: '已完成',
  [OrderStatus.AUTO_CONFIRM]: '系统自动完成',
  [OrderStatus.STAFF_CANCEL]: '已取消',
  [OrderStatus.ADMIN_CANCEL]: '已取消',
  [OrderStatus.UPDATE_TIME]: '修改预约时间',
}

/**
 * 状态颜色映射（用于 tag 样式）
 */
export const OrderStatusColorMap: Record<number, string> = {
  [OrderStatus.CREATE]: '#ff9900',
  [OrderStatus.CANCEL]: '#909399',
  [OrderStatus.CHECKED]: '#19be6b',
  [OrderStatus.PAY]: '#2979ff',
  [OrderStatus.SHIP]: '#fa3534',
  [OrderStatus.SERVICE_COMPLETED]: '#f56c6c',
  [OrderStatus.CONFIRM]: '#19be6b',
  [OrderStatus.AUTO_CONFIRM]: '#19be6b',
  [OrderStatus.STAFF_CANCEL]: '#909399',
  [OrderStatus.ADMIN_CANCEL]: '#909399',
  [OrderStatus.UPDATE_TIME]: '#ff9900',
}
