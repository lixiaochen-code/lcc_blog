import { defineStore } from 'pinia'
import type { ChannelItem } from '@/api/Home/interfaces'

export interface CategoryState {
  /** 服务类目列表 */
  channelList: ChannelItem[]
  scene: string
}

export const useCategoryStore = defineStore('category', {
  state: (): CategoryState => ({
    channelList: [],
    scene: '',
  }),

  getters: {
    /** 获取类目列表 */
    getChannelList: state => state.channelList,

    /** 根据 ID 获取类目 */
    getChannelById: state => (id: number) => state.channelList.find(item => item.id === id),

    /** 根据名称获取类目 */
    getChannelByName: state => (name: string) => state.channelList.find(item => item.name === name),

    /** 是否已加载类目数据 */
    hasChannelData: state => state.channelList.length > 0,
  },

  actions: {
    /** 设置类目列表 */
    setChannelList(list: ChannelItem[]) {
      this.channelList = list
    },

    /** 清空类目数据 */
    clearChannelList() {
      this.channelList = []
    },
    setScene(scene: string) {
      this.scene = scene
    },
    clearScene() {
      this.scene = ''
    },
  },

  persist: true,
})
