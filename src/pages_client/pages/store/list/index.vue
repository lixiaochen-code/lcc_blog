<template>
  <DefaultLayout>
    <view class="flex flex-col h-full">
      <!-- 搜索栏 -->
      <view class="bg-white px-[24rpx] py-[10rpx] flex items-center gap-[12rpx]">
        <view class="flex items-center gap-[8rpx]" @click="handleLocationClick">
          <up-icon name="map" size="32" color="#e8403a"></up-icon>
          <text class="text-[28rpx] text-[#333]">{{ userStore.city || '定位中' }}</text>
        </view>
        <view class="flex-1">
          <up-search
            v-model="searchInput"
            placeholder="搜索门店"
            :show-action="true"
            action-text="搜索"
            shape="round"
            bg-color="#f3f3f3"
            @search="handleSearch"
            @custom="handleSearch"
            @clear="handleClear"
          ></up-search>
        </view>
      </view>

      <!-- 门店列表 -->
      <view class="flex-1 h-0 px-[24rpx] pt-[20rpx]">
        <LoadingMore
          :height="'100%'"
          :api="fetchStoreList"
          :params="queryParams"
          :limit="10"
          empty-mode="list"
          empty-text="暂无门店信息"
        >
          <template #item="{ item }">
            <view
              class="bg-white rounded-[24rpx] mb-[20rpx] overflow-hidden shadow-sm"
              @click="handleStoreClick(item)"
            >
              <!-- 图片 + 信息 -->
              <view class="flex gap-[20rpx] p-[24rpx]">
                <image
                  class="w-[180rpx] h-[180rpx] rounded-[16rpx] flex-shrink-0 bg-[#f5f5f5]"
                  :src="asStore(item).stores.picUrl || defaultStoreImg"
                  mode="aspectFill"
                ></image>
                <view class="flex-1 flex flex-col justify-between overflow-hidden">
                  <!-- 门店名 + 评分 -->
                  <view class="flex items-center justify-between">
                    <text class="text-[30rpx] font-600 text-[#222] line-clamp-1 flex-1 mr-[12rpx]">
                      {{ asStore(item).stores.name }}
                    </text>
                    <view class="flex items-center gap-[6rpx] flex-shrink-0">
                      <up-icon name="star-fill" size="22" color="#f5a623"></up-icon>
                      <text class="text-[24rpx] text-[#333] font-500">
                        {{ asStore(item).star > 0 ? asStore(item).star.toFixed(1) : '暂无' }}
                      </text>
                    </view>
                  </view>

                  <!-- 地址 -->
                  <view class="flex items-center gap-[8rpx]">
                    <up-icon name="map-fill" size="22" color="#999"></up-icon>
                    <text class="text-[24rpx] text-[#666] line-clamp-1">
                      {{ asStore(item).stores.address }}
                    </text>
                  </view>

                  <!-- 距离 + 营业时间 -->
                  <view class="flex items-center gap-[24rpx] text-[24rpx] text-[#999]">
                    <view class="flex items-center gap-[6rpx]">
                      <text>{{ formatDistance(asStore(item).distance) }}</text>
                    </view>
                    <view class="flex items-center gap-[6rpx]">
                      <up-icon name="clock" size="20" color="#999"></up-icon>
                      <text>{{ formatBusinessTime(asStore(item).businessTime) }}</text>
                    </view>
                  </view>

                  <!-- 标签 -->
                  <view
                    v-if="getServerTags(asStore(item).stores.serverTag).length > 0"
                    class="flex gap-[10rpx] flex-wrap"
                  >
                    <up-tag
                      v-for="tag in getServerTags(asStore(item).stores.serverTag)"
                      :key="tag"
                      :text="tag"
                      type="warning"
                      plain
                      plain-fill
                      size="mini"
                      shape="circle"
                    ></up-tag>
                  </view>
                </view>
              </view>
            </view>
          </template>
        </LoadingMore>
      </view>
    </view>
  </DefaultLayout>
</template>

<script setup lang="ts">
  import DefaultLayout from '@/components/DefaultLayout/index.vue'
  import LoadingMore from '@/components/LoadingMore/index.vue'
  import { computed, ref } from 'vue'
  import { getStoreList } from '@/api/CarStoreService'
  import type { StoreListItem } from '@/api/CarStoreService/interfaces'
  import { useUserStore } from '@/store/user'

  const userStore = useUserStore()
  const searchInput = ref('')
  const keyword = ref('')
  const defaultStoreImg = 'https://cdn.uviewui.com/uview/album/1.jpg'

  // ========== 类型断言辅助 ==========
  const asStore = (item: unknown) => item as StoreListItem

  // ========== 查询参数 ==========
  const queryParams = computed<Record<string, unknown>>(() => ({
    keyWord: keyword.value || undefined,
    latitude: userStore.location.lat || undefined,
    longitude: userStore.location.lng || undefined,
  }))

  // ========== 请求适配 ==========
  const fetchStoreList = (params: any) => {
    return getStoreList(params)
  }

  // ========== 搜索 ==========
  const handleSearch = () => {
    keyword.value = searchInput.value
  }
  const handleClear = () => {
    keyword.value = ''
  }

  // ========== 距离格式化 ==========
  const formatDistance = (distance?: number) => {
    if (!distance || distance <= 0) return '未知'
    if (distance >= 1000) {
      return (distance / 1000).toFixed(1) + 'km'
    }
    return Math.round(distance) + 'm'
  }

  // ========== 营业时间格式化 ==========
  const formatBusinessTime = (businessTime?: string[][]) => {
    if (!businessTime || businessTime.length === 0) return '暂无'
    const first = businessTime[0]
    if (!first || first.length < 2) return '暂无'
    return first.join('-')
  }

  // ========== 服务标签解析 ==========
  const getServerTags = (serverTag?: string) => {
    if (!serverTag) return []
    return serverTag.split(',').filter(Boolean)
  }

  // ========== 点击定位 ==========
  const handleLocationClick = () => {
    uni.chooseLocation({
      success: res => {
        userStore.setLocation({ lat: res.latitude, lng: res.longitude })
        if (res.name) {
          userStore.setCity(res.name)
        }
      },
    })
  }

  // ========== 点击门店 ==========
  const handleStoreClick = (item: unknown) => {
    const store = item as StoreListItem
    uni.navigateTo({
      url: `/pages_client/pages/store/detail/index?id=${store.stores.id}`,
    })
  }
</script>

<style lang="scss" scoped></style>
