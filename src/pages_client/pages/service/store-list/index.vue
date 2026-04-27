<template>
  <DefaultLayout>
    <view class="flex flex-col h-full">
      <view class="bg-white sticky top-0 z-10 flex justify-center">
        <up-tabs
          :list="tabList"
          :current="currentTab"
          line-color="#e8403a"
          active-color="#e8403a"
          inactive-color="#333"
          item-style="height: 88rpx; padding: 0 30rpx;"
          @change="handleTabChange"
        ></up-tabs>
      </view>

      <view class="flex-1 h-0 px-[24rpx] pt-[20rpx]">
        <LoadingMore
          ref="listRef"
          :height="'100%'"
          :api="fetchStoreServiceList"
          :params="queryParams"
          :limit="10"
          empty-mode="list"
          empty-text="暂无门店信息"
        >
          <template #item="{ item }">
            <view
              class="bg-white rounded-[24rpx] mb-[24rpx] shadow-sm overflow-hidden"
              @click="handleStoreClick(item as unknown as StoreServiceListItem)"
            >
              <!-- 门店图片 + 基本信息 -->
              <view class="flex gap-[20rpx] p-[24rpx]">
                <image
                  class="w-[180rpx] h-[180rpx] rounded-[16rpx] flex-shrink-0 bg-[#f5f5f5]"
                  :src="(item as unknown as StoreServiceListItem).picUrl || defaultStoreImg"
                  mode="aspectFill"
                ></image>
                <view class="flex-1 flex flex-col justify-between overflow-hidden">
                  <!-- 门店名 -->
                  <view>
                    <text class="text-[30rpx] font-bold text-[#111] line-clamp-1">{{
                      (item as unknown as StoreServiceListItem).storeName
                    }}</text>
                    <text
                      v-if="item.brief"
                      class="text-[24rpx] text-[#999] line-clamp-1 mt-[6rpx] block"
                      >{{ item.brief }}</text
                    >
                  </view>

                  <!-- 地址 -->
                  <view class="flex items-center gap-[8rpx]">
                    <up-icon name="map-fill" color="#999" size="22"></up-icon>
                    <text class="text-[24rpx] text-[#666] line-clamp-1">{{
                      (item as unknown as StoreServiceListItem).address
                    }}</text>
                  </view>

                  <!-- 距离 + 营业时间 + 标签 -->
                  <view class="flex items-center gap-[16rpx] text-[24rpx] text-[#999]">
                    <view class="flex items-center gap-[6rpx]">
                      <up-icon name="clock" color="#999" size="20"></up-icon>
                      <text>{{
                        ((item as unknown as any).businessTime?.[0] || []).join('-') || '暂无'
                      }}</text>
                    </view>
                    <text
                      >{{
                        ((item as unknown as StoreServiceListItem).distance / 1000).toFixed(1)
                      }}km</text
                    >
                  </view>

                  <view
                    v-if="(item as unknown as any).serverTag"
                    class="flex flex-wrap gap-[10rpx]"
                  >
                    <up-tag
                      v-for="(tag, tIndex) in ((item as unknown as any).serverTag || '')
                        .split(',')
                        .filter(Boolean)"
                      :key="tIndex"
                      :text="tag"
                      type="error"
                      plain
                      plain-fill
                      size="mini"
                      shape="circle"
                    ></up-tag>
                  </view>
                </view>
              </view>

              <!-- 服务列表 -->
              <view
                v-if="
                  (item as unknown as any).serviceList &&
                  (item as unknown as any).serviceList.length > 0
                "
                class="flex flex-col border-t border-[#f2f2f2] mx-[24rpx] pt-[8rpx] pb-[16rpx]"
              >
                <template
                  v-for="(prod, pIndex) in getVisibleServices(item as unknown as any)"
                  :key="pIndex"
                >
                  <view
                    class="flex items-center justify-between py-[16rpx]"
                    @click.stop="handleToDetails(prod)"
                  >
                    <text
                      class="text-[28rpx] text-[#333] font-500 line-clamp-1 flex-1 pr-[20rpx]"
                      >{{ prod.serviceName }}</text
                    >
                    <view class="flex items-center gap-[20rpx] flex-shrink-0">
                      <PriceDisplay :price="prod.price" :cost-price="prod.costPrice" size="sm" />
                      <view @click.stop>
                        <up-button
                          type="error"
                          shape="circle"
                          :custom-style="{
                            width: '120rpx',
                            height: '56rpx',
                            fontSize: '24rpx',
                            margin: '0',
                          }"
                          @click="handleBuy(item, prod)"
                          >预约</up-button
                        >
                      </view>
                    </view>
                  </view>
                </template>
                <view
                  v-if="
                    (item as unknown as any).serviceList.length > 3 &&
                    !expandedStores[(item as unknown as any).storeId]
                  "
                  class="flex items-center justify-center py-[12rpx]"
                  @click.stop="expandedStores[(item as unknown as any).storeId] = true"
                >
                  <text class="text-[24rpx] text-[#999] mr-[4rpx]"
                    >查看全部{{ (item as unknown as any).serviceList.length }}项服务</text
                  >
                  <up-icon name="arrow-down" size="12" color="#999"></up-icon>
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
  import { onLoad } from '@dcloudio/uni-app'
  import { computed, reactive, ref } from 'vue'
  import { getStoreServiceList } from '@/api/CarStoreService/index'
  import type { StoreServiceListItem } from '@/api/CarStoreService/interfaces'
  import { useCategoryStore } from '@/store/category'
  import PriceDisplay from '@/components/PriceDisplay/index.vue'
  import { useUserStore } from '@/store/user'

  const categoryStore = useCategoryStore()
  const userStore = useUserStore()
  const listRef = ref<InstanceType<typeof LoadingMore> | null>(null)
  const expandedStores = reactive<Record<string | number, boolean>>({})
  const defaultStoreImg = 'https://cdn.uviewui.com/uview/album/1.jpg'

  const getVisibleServices = (item: any) => {
    const list = item.serviceList || []
    if (expandedStores[item.storeId]) return list
    return list.slice(0, 3)
  }

  const currentTab = ref(0)
  const queryServiceCode = ref<string>()

  const tabList = computed(() =>
    categoryStore.channelList.map(item => ({
      ...item,
      name: item.name,
    }))
  )

  const currentCategory = computed(() => tabList.value[currentTab.value])

  const queryParams = computed<Record<string, unknown>>(() => ({
    category: queryServiceCode.value ? undefined : currentCategory.value?.id,
    serverCode: queryServiceCode.value,
    latitude: userStore.location.lat,
    longitude: userStore.location.lng,
  }))

  const handleTabChange = (item: { index: number }) => {
    currentTab.value = item.index
    queryServiceCode.value = undefined // 切换分类时清除服务代码筛选
  }

  const fetchStoreServiceList = (params: {
    page: number
    limit: number
    category?: number
    serverCode?: string
    latitude?: number
    longitude?: number
  }) => {
    return getStoreServiceList({
      category: params.category,
      serviceCode: params.serverCode,
      page: params.page,
      limit: params.limit,
      latitude: params.latitude,
      longitude: params.longitude,
    })
  }

  const handleStoreClick = (store: StoreServiceListItem) => {
    uni.navigateTo({ url: `/pages_client/pages/store/detail/index?id=${store.storeId}` })
  }

  const handleBuy = (store: any, prod: any) => {
    const query = [
      `serviceCode=${encodeURIComponent(prod.serviceCode)}`,
      `storeId=${store.storeId}`,
      `storeName=${encodeURIComponent(store.storeName)}`,
    ].join('&')
    uni.navigateTo({ url: `/pages_client/pages/service/booking/index?${query}` })
  }

  onLoad(options => {
    const id = options?.id ? Number(options.id) : undefined
    if (id) {
      const index = tabList.value.findIndex(item => item.id === id)
      if (index !== -1) {
        currentTab.value = index
      }
    }
    if (options?.serviceCode) {
      queryServiceCode.value = options.serviceCode
    }
  })

  const handleToDetails = (item: StoreServiceListItem) => {
    uni.navigateTo({ url: `/pages_client/pages/service/details/index?id=${item.id}` })
  }
</script>
