<template>
  <up-popup :show="show" round="24" mode="bottom" :closeable="true" @close="handleClose">
    <view class="flex flex-col h-full">
      <!-- 标题栏 -->
      <view
        class="flex items-center justify-between px-[30rpx] pt-[30rpx] pb-[20rpx] border-b border-[#f0f0f0]"
      >
        <text class="text-[32rpx] font-bold text-[#222]">选择门店</text>
        <up-icon name="close" size="22" color="#999" @click="handleClose"></up-icon>
      </view>

      <!-- 搜索栏 -->
      <view class="px-[24rpx] py-[20rpx]">
        <up-search
          v-model="searchKeyword"
          placeholder="搜索门店名称或地址"
          :show-action="true"
          action-text="搜索"
          shape="round"
          bg-color="#f3f3f3"
          @search="handleSearch"
          @clear="handleClearSearch"
        ></up-search>
      </view>

      <!-- 门店列表 -->
      <scroll-view scroll-y class="h-600rpx h-0 px-[24rpx] box-border">
        <up-empty
          v-if="!loading && filteredStores.length === 0"
          text="暂无门店信息"
          icon-size="120"
          mode="list"
        ></up-empty>

        <view v-for="store in filteredStores" :key="store.stores.id" class="mb-[20rpx]">
          <view
            :class="[
              'bg-white rounded-[16rpx] p-[20rpx] border-2 border-solid transition-colors',
              selectedStoreId === store.stores.id
                ? 'border-[#e8403a] bg-[#fff5f5]'
                : 'border-[#f0f0f0]',
            ]"
            @click="handleSelectStore(store)"
          >
            <!-- 门店名 + 评分 -->
            <view class="flex items-center justify-between mb-[10rpx]">
              <text class="text-[28rpx] font-600 text-[#222]">
                {{ store.stores.name }}
              </text>
              <view class="flex items-center gap-[6rpx]">
                <up-icon name="star-fill" size="24" color="#f5a623"></up-icon>
                <text class="text-[24rpx] text-[#333]">
                  {{ store.star > 0 ? store.star.toFixed(1) : '暂无' }}
                </text>
              </view>
            </view>

            <!-- 地址 -->
            <view class="flex items-center gap-[10rpx] mb-[10rpx]">
              <up-icon name="map" size="24" color="#999"></up-icon>
              <text class="text-[24rpx] text-[#666] flex-1">
                {{ store.stores.address }}
              </text>
            </view>

            <!-- 距离 + 营业时间 -->
            <view class="flex items-center gap-[20rpx] mb-[16rpx]">
              <text class="text-[24rpx] text-[#666]">
                距离：{{ formatDistance(store.distance) }}
              </text>
              <text class="text-[24rpx] text-[#666]">
                营业：{{ formatBusinessTime(store.businessTime) }}
              </text>
            </view>

            <!-- 标签 -->
            <view
              v-if="getServerTags(store.stores.serverTag).length > 0"
              class="flex gap-[12rpx] flex-wrap"
            >
              <up-tag
                v-for="tag in getServerTags(store.stores.serverTag)"
                :key="tag"
                :text="tag"
                type="warning"
                plain
                plain-fill
                size="mini"
              ></up-tag>
            </view>
          </view>
        </view>

        <!-- 加载状态 -->
        <view v-if="loading" class="text-center py-[40rpx]">
          <up-loading-icon></up-loading-icon>
          <text class="text-[26rpx] text-[#999] ml-[12rpx]">加载中...</text>
        </view>
      </scroll-view>

      <!-- 底部按钮 -->
      <view class="px-[24rpx] py-[30rpx] border-t border-[#f0f0f0]">
        <up-button
          type="error"
          shape="circle"
          text="确认选择"
          :disabled="!selectedStoreId"
          @click="handleConfirm"
        ></up-button>
      </view>
    </view>
  </up-popup>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { getStoreList } from '@/api/CarStoreService'
  import type { StoreListItem } from '@/api/CarStoreService/interfaces'

  interface Props {
    show: boolean
    serviceCode?: string
    storeServiceId?: number
    longitude?: number
    latitude?: number
    selectedStoreId?: number
  }

  interface Emits {
    (e: 'update:show', value: boolean): void
    (e: 'update:selectedStoreId', value: number): void
    (e: 'confirm', store: StoreListItem): void
    (e: 'close'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    show: false,
    serviceCode: '',
    storeServiceId: undefined,
    longitude: undefined,
    latitude: undefined,
    selectedStoreId: undefined,
  })

  const emit = defineEmits<Emits>()

  // 状态
  const stores = ref<StoreListItem[]>([])
  const loading = ref(false)
  const searchKeyword = ref('')

  // 计算属性
  const queryParams = computed(() => ({
    serviceCode: props.serviceCode || undefined,
    keyWord: searchKeyword.value || undefined,
    longitude: props.longitude || undefined,
    latitude: props.latitude || undefined,
    page: 1,
    limit: 20,
  }))

  const filteredStores = computed(() => {
    if (!searchKeyword.value) return stores.value
    const keyword = searchKeyword.value.toLowerCase()
    return stores.value.filter(
      store =>
        store.stores.name.toLowerCase().includes(keyword) ||
        store.stores.address.toLowerCase().includes(keyword)
    )
  })

  // 方法
  const fetchStores = async () => {
    loading.value = true
    try {
      const res = await getStoreList(queryParams.value)
      stores.value = res.list || res.records || res.data || []
    } catch (error) {
      console.error('获取门店列表失败:', error)
      uni.showToast({ title: '获取门店列表失败', icon: 'none' })
    } finally {
      loading.value = false
    }
  }

  const handleSearch = () => {
    fetchStores()
  }

  const handleClearSearch = () => {
    searchKeyword.value = ''
    fetchStores()
  }

  const handleSelectStore = (store: StoreListItem) => {
    emit('update:selectedStoreId', store.stores.id)
  }

  const handleConfirm = () => {
    const selectedStore = stores.value.find(store => store.stores.id === props.selectedStoreId)
    if (selectedStore) {
      emit('confirm', selectedStore)
      handleClose()
    }
  }

  const handleClose = () => {
    emit('update:show', false)
    emit('close')
  }

  const formatDistance = (distance?: number) => {
    if (!distance || distance <= 0) return '未知'
    if (distance >= 1000) {
      return (distance / 1000).toFixed(1) + 'km'
    }
    return Math.round(distance) + 'm'
  }

  const formatBusinessTime = (businessTime?: string[][]) => {
    if (!businessTime || businessTime.length === 0) return '暂无'
    const first = businessTime[0]
    if (!first || first.length < 2) return '暂无'
    return first.join('-')
  }

  const getServerTags = (serverTag?: string) => {
    if (!serverTag) return []
    return serverTag.split(',').filter(Boolean)
  }

  // 监听器
  watch(
    () => props.show,
    newVal => {
      if (newVal) {
        fetchStores()
      }
    }
  )

  watch(
    () => props.longitude,
    () => {
      if (props.show) {
        fetchStores()
      }
    }
  )

  watch(
    () => props.latitude,
    () => {
      if (props.show) {
        fetchStores()
      }
    }
  )
</script>

<style lang="scss" scoped></style>
