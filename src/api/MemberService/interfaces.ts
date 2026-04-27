export interface MallUser {
  addTime?: string
  avatar?: string
  birthday?: string
  deleted?: boolean
  gender?: number
  id?: number
  idCard?: string
  lastButOneLoginIp?: string
  lastButOneLoginTime?: string
  lastLoginIp?: string
  lastLoginTime?: string
  mobile?: string
  nickname?: string
  password?: string
  realNameState?: number
  referrerUserId?: number
  sessionKey?: string
  status?: number
  updateTime?: string
  userLevel?: number
  userType?: number
  username?: string
  weixinOpenid?: string
}

export interface UserQuery {
  userId?: number
}

/** 修改店员/店长信息 */
export interface StaffUpdateVO {
  id?: number
  name?: string
  avatarUrl?: string
  phone?: string
  desc?: string
  userId?: number
  storeId?: number
  role?: string
  workStatus?: number
}
