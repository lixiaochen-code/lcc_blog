import { defineStore } from 'pinia'
import homeIcon from '@/static/global/home.png'
import homeActiveIcon from '@/static/global/home-active.png'
import orderIcon from '@/static/global/order.png'
import orderActiveIcon from '@/static/global/order-active.png'
import centerIcon from '@/static/global/center.png'
import centerActiveIcon from '@/static/global/center-active.png'

export enum UserRole {
  CLIENT = '1',
  MANAGER = '2',
  STAFF = '3',
}

export interface Location {
  lat: number
  lng: number
}

export interface LoginUserData {
  id: number
  nickname: string
  avatar: string
  mobile: string
  gender: number
  userLevel: number
  weixinOpenid: string
}

export interface StaffInfo {
  id: number
  name: string
  phone: string
  avatarUrl: string
  desc: string
  role: string
  storeId: number
  userId: number
  workStatus: number
  deleted: boolean
  addTime: string
  updateTime: string
}

export interface StoreInfo {
  id: number
  name: string
  picUrl: string
  [key: string]: unknown
}

export interface UserInfo {
  role: UserRole
  token: string
  userId: number
  userData: LoginUserData | null
  staffInfo: StaffInfo | null
  storeInfo: StoreInfo | null
  location: Location
  city: string
  referrerUserId: number | null
  /** 登录后需要检查授权信息（一次性标记） */
  needAuthCheck: boolean
}
export const useUserStore = defineStore('user', {
  state: (): UserInfo => ({
    role: null,
    token: '',
    userId: 0,
    userData: null,
    staffInfo: null,
    storeInfo: null,
    location: { lat: 0, lng: 0 },
    city: '重庆市',
    referrerUserId: null,
    needAuthCheck: false,
  }),

  getters: {
    tabbarList(state): Array<{
      pagePath: string
      text: string
      icon: string
      selectedIcon: string
    }> {
      switch (state.role) {
        case UserRole.CLIENT:
          return [
            {
              pagePath: '/pages/client/home/index',
              text: '首页',
              icon: homeIcon,
              selectedIcon: homeActiveIcon,
            },
            {
              pagePath: '/pages/client/order/index',
              text: '订单',
              icon: orderIcon,
              selectedIcon: orderActiveIcon,
            },
            {
              pagePath: '/pages/client/user/index',
              text: '我的',
              icon: centerIcon,
              selectedIcon: centerActiveIcon,
            },
          ]
        case UserRole.STAFF:
          return [
            {
              pagePath: '/pages/staff/home/index',
              text: '首页',
              icon: 'home',
              selectedIcon: 'home-fill',
            },
            {
              pagePath: '/pages/staff/order/index',
              text: '订单',
              icon: 'order',
              selectedIcon: 'order',
            },
            // {
            //   pagePath: '/pages/staff/record/index',
            //   text: '记录',
            //   icon: 'clock',
            //   selectedIcon: 'clock-fill',
            // },
            {
              pagePath: '/pages/staff/user/index',
              text: '我的',
              icon: 'account',
              selectedIcon: 'account-fill',
            },
          ]
        case UserRole.MANAGER:
          return [
            {
              pagePath: '/pages/manager/home/index',
              text: '统计',
              icon: 'integral',
              selectedIcon: 'integral-fill',
            },
            {
              pagePath: '/pages/manager/order/index',
              text: '订单',
              icon: 'eye',
              selectedIcon: 'eye-fill',
            },
            {
              pagePath: '/pages/manager/user/index',
              text: '我的',
              icon: 'account',
              selectedIcon: 'account-fill',
            },
          ]
        default:
          return [
            {
              pagePath: '/pages/client/home/index',
              text: '首页',
              icon: homeIcon,
              selectedIcon: homeActiveIcon,
            },
            {
              pagePath: '/pages/client/order/index',
              text: '订单',
              icon: orderIcon,
              selectedIcon: orderActiveIcon,
            },
            {
              pagePath: '/pages/client/user/index',
              text: '我的',
              icon: centerIcon,
              selectedIcon: centerActiveIcon,
            },
          ]
      }
    },
  },

  actions: {
    setRole(newRole: UserRole) {
      this.role = newRole
    },
    setToken(token: string) {
      this.token = token
    },
    setUserId(id: number) {
      this.userId = id
    },
    setUserData(data: LoginUserData) {
      this.userData = data
    },
    setStaffInfo(data: StaffInfo) {
      this.staffInfo = data
    },
    setStoreInfo(data: StoreInfo) {
      this.storeInfo = data
    },
    setLocation(newLocation: Location) {
      this.location = newLocation
    },
    setCity(newCity: string) {
      this.city = newCity
    },
    setReferrerUserId(id: number | null) {
      this.referrerUserId = id
    },
    setNeedAuthCheck(val: boolean) {
      this.needAuthCheck = val
    },
    logout() {
      this.token = ''
      this.userId = 0
      this.userData = null
      this.staffInfo = null
      this.storeInfo = null
      this.userData = null
      this.referrerUserId = null
    },
  },
  persist: true,
})
