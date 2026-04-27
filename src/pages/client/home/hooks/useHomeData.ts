import { ref, computed, watch } from 'vue'
import { useRequest } from 'alova/client'
import { getIndex } from '@/api/Home'
import { getStoreList } from '@/api/CarStoreService'
import type {
  BannerItem,
  HomeIndexData,
  RecommendServerItem,
  BaseResponse,
  ChannelItem,
} from '@/api/Home/interfaces'
import type { StoreListItem, StoreListResponse } from '@/api/CarStoreService/interfaces'
import { useLoading } from '@/hooks/useLoading'
import type { RecommendItem, StoreViewItem } from '../types'
import { getAutoLocation } from '@/utils/location'
import { useUserStore } from '@/store/user'
import { useCategoryStore } from '@/store/category'
type HomeResponse = HomeIndexData | BaseResponse<HomeIndexData>
type StoreListResponseWrapper = {
  data?: StoreListResponse
}

export function useHomeData() {
  const bannerList = ref<BannerItem[]>([])
  const recommendList = ref<RecommendItem[]>([])
  const packageList = ref<RecommendItem[]>([])
  const storeList = ref<StoreViewItem[]>([])
  const channelList = ref<ChannelItem[]>([])

  const userStore = useUserStore()
  const categoryStore = useCategoryStore()

  const resolveHomeData = (response: HomeResponse): HomeIndexData => {
    if ('data' in response) {
      return response.data
    }
    return response
  }

  const isStoreListResponseWrapper = (
    response: StoreListResponse | StoreListResponseWrapper
  ): response is StoreListResponseWrapper => {
    const data = (response as StoreListResponseWrapper).data
    return typeof data === 'object' && data !== null && !Array.isArray(data)
  }

  const resolveStoreList = (
    response: StoreListResponse | StoreListResponseWrapper
  ): StoreListItem[] => {
    const payload: StoreListResponse = isStoreListResponseWrapper(response)
      ? (response.data ?? {})
      : response
    const list = payload.list ?? payload.records ?? payload.data
    return Array.isArray(list) ? list : []
  }

  const mapStoreItem = (item: StoreListItem): StoreViewItem => {
    const info = item.stores
    const distanceNum = info.distance || item.distance || 0
    let distanceStr = ''
    if (distanceNum > 1000) {
      distanceStr = (distanceNum / 1000).toFixed(1) + 'km'
    } else {
      distanceStr = distanceNum + 'm'
    }

    let hoursStr = '暂无营业时间'
    if (item.businessTime && item.businessTime.length > 0 && item.businessTime[0].length > 0) {
      hoursStr = item.businessTime[0].join('-')
    }

    return {
      id: info.id,
      name: info.name,
      score: item.star,
      address: info.address,
      distance: distanceStr,
      hours: hoursStr,
      tags: info.serverTag ? info.serverTag.split(',').filter(Boolean) : [],
      image: JSON.parse(info.gallery || '[]'),
    }
  }

  const {
    loading: homeLoading,
    data: homeData,
    error: homeError,
    send: fetchHome,
  } = useRequest((params?: { latitude?: number; longitude?: number }) => getIndex(params || {}), {
    immediate: false,
  })

  const {
    loading: storeLoading,
    data: storeData,
    error: storeError,
    send: fetchStoreList,
  } = useRequest(
    (params?: { page: number; limit: number; latitude: number; longitude: number }) =>
      getStoreList(
        params || {
          page: 1,
          limit: 5,
          latitude: userStore.location.lat,
          longitude: userStore.location.lng,
        }
      ),
    { immediate: false }
  )

  // 先获取位置，再请求首页和门店数据
  const fetchWithLocation = (lat: number, lng: number) => {
    fetchHome({ latitude: lat, longitude: lng })
    fetchStoreList({ page: 1, limit: 5, latitude: lat, longitude: lng })
  }

  getAutoLocation()
    .then(({ lat, lng }) => {
      userStore.setLocation({ lat, lng })
      fetchWithLocation(lat, lng)
    })
    .catch(() => {
      // 定位失败，使用持久化的历史位置
      fetchWithLocation(userStore.location.lat, userStore.location.lng)
    })

  watch(homeData, res => {
    if (!res) return
    const data = resolveHomeData(res as HomeResponse)
    bannerList.value = data.banner || []
    if (data.recommendServers) {
      recommendList.value = data.recommendServers.map((item: RecommendServerItem) => ({
        ...item,
        name: item.name,
        brief: item.brief || '',
        price: item.price,
        costPrice: item.costPrice,
        picUrl: item.picUrl,
      })) as RecommendItem[]

      channelList.value = data.channel || []
      categoryStore.setChannelList(data.channel || [])
    }
    if (data.packageServers) {
      packageList.value = data.packageServers.map((item: RecommendServerItem) => ({
        ...item,
        name: item.name,
        brief: item.brief || '',
        price: item.price,
        costPrice: item.costPrice,
        picUrl: item.picUrl,
      })) as RecommendItem[]
    }
  })

  watch(homeError, error => {
    if (!error) return
    console.error('获取首页数据失败:', error)
    uni.showToast({ title: '加载失败', icon: 'none' })
  })

  watch(storeData, res => {
    if (!res) return
    const list = resolveStoreList(res as StoreListResponse | StoreListResponseWrapper)
    storeList.value = list.map(mapStoreItem)
  })

  watch(storeError, error => {
    if (!error) return
    console.error('获取门店列表失败:', error)
  })

  const loading = computed(() => homeLoading.value || storeLoading.value)
  useLoading(loading)

  const refresh = () => {
    fetchWithLocation(userStore.location.lat, userStore.location.lng)
  }

  return {
    bannerList,
    recommendList,
    packageList,
    storeList,
    loading,
    refresh,
    channelList,
  }
}
