<template>
  <DefaultLayout>
    <view class="relative">
      <ShowPhoto
        height="400rpx"
        :images="JSON.parse(storeInfo?.realTimeInfo?.stores?.gallery || `[]`) as []"
      />
      <view
        class="absolute left-0 right-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white px-[30rpx] pb-[50rpx] pt-[80rpx] flex items-end justify-between"
      >
        <view class="flex flex-col gap-[8rpx]">
          <text
            v-if="storeInfo?.realTimeInfo?.star"
            class="text-[36rpx] font-bold tracking-wide shadow-sm"
            >{{ storeInfo?.realTimeInfo?.star }} 分</text
          >
          <text v-else class="text-[36rpx] font-bold tracking-wide shadow-sm">暂无评价</text>
          <up-rate
            v-if="storeInfo?.realTimeInfo?.star"
            :model-value="storeInfo?.realTimeInfo?.star"
            size="16"
            active-color="#fbdb00"
            gutter="2"
            readonly
          />
        </view>
        <text class="text-[24rpx] opacity-90 shadow-sm">{{
          storeInfo?.realTimeInfo?.stores?.brief || ''
        }}</text>
      </view>
    </view>

    <!-- 门店基础信息 -->
    <view
      class="bg-white rounded-[24rpx] mx-[24rpx] mt-[-30rpx] mb-[24rpx] p-[30rpx] relative z-10 shadow-sm"
    >
      <view class="flex flex-col gap-[12rpx]">
        <text class="text-[36rpx] font-bold text-[#111] leading-tight">{{ storeName }}</text>
        <view class="flex items-center gap-[8rpx] mt-[4rpx]">
          <up-icon name="map-fill" color="#999" size="26" class="mt-[6rpx]"></up-icon>
          <text class="text-[26rpx] text-[#666] leading-snug flex-1">{{ storeAddress }}</text>
        </view>
      </view>

      <view
        class="flex items-center gap-[24rpx] text-[24rpx] text-[#666] mt-[20rpx] bg-[#f8f8f8] p-[16rpx] rounded-[12rpx]"
      >
        <view class="flex items-center gap-[8rpx]">
          <up-icon name="clock" color="#666" size="24"></up-icon>
          <text>{{ businessHours }}</text>
        </view>
        <view class="w-[2rpx] h-[20rpx] bg-[#ddd]"></view>
        <text>距离 {{ storeDistance }}</text>
      </view>

      <view v-if="tags && tags.length > 0" class="mt-[24rpx] flex flex-wrap gap-[12rpx]">
        <up-tag
          v-for="(tag, index) in tags"
          :key="index"
          type="error"
          plain
          plain-fill
          size="mini"
          shape="circle"
          :text="tag"
        />
      </view>

      <view
        class="mt-[30rpx] pt-[24rpx] border-t border-[#f2f2f2] flex items-center justify-between"
      >
        <view class="flex gap-[24rpx]">
          <view
            class="flex items-center justify-center gap-[8rpx] px-[32rpx] py-[12rpx] bg-[#fff5f5] rounded-full active:bg-[#ffebeb] transition-colors"
            @click="handleNavigation"
          >
            <up-icon name="map" color="#e8403a" size="28"></up-icon>
            <text class="text-[26rpx] font-500 text-[#e8403a]">导航</text>
          </view>
          <view
            class="flex items-center justify-center gap-[8rpx] px-[32rpx] py-[12rpx] bg-[#f0f7ff] rounded-full active:bg-[#e1f0ff] transition-colors"
            @click="handleCall"
          >
            <up-icon name="phone" color="#2b85e4" size="28"></up-icon>
            <text class="text-[26rpx] font-500 text-[#2b85e4]">电话</text>
          </view>
        </view>
        <view
          class="flex flex-col items-center justify-center gap-[4rpx] pl-[24rpx] border-l border-[#f2f2f2]"
          @click="handleToggleCollect"
        >
          <up-icon
            :name="data.isCollect ? 'heart-fill' : 'heart'"
            size="40"
            :color="data.isCollect ? '#e8403a' : '#999'"
          ></up-icon>
          <text :class="['text-[20rpx]', data.isCollect ? 'text-[#e8403a]' : 'text-[#999]']">
            {{ data.isCollect ? '已收藏' : '收藏' }}
          </text>
        </view>
      </view>
    </view>

    <!-- 服务项目 -->
    <view v-if="serviceList.length > 0" class="mx-[24rpx] mb-[24rpx]">
      <view class="flex items-center gap-[12rpx] mb-[16rpx] px-[8rpx]">
        <view class="w-[8rpx] h-[30rpx] bg-[#e8403a] rounded-full"></view>
        <text class="text-[32rpx] font-bold text-[#222]">服务项目</text>
      </view>
      <view class="bg-white rounded-[24rpx] p-[10rpx] shadow-sm">
        <view
          v-for="(item, index) in serviceList"
          :key="index"
          :class="[
            'p-[20rpx]',
            index !== serviceList.length - 1 ? 'border-b border-[#f5f5f5]' : '',
          ]"
        >
          <view class="flex items-center gap-[20rpx]" @click.stop="handleToDetails(item)">
            <view class="rounded-[16rpx] overflow-hidden bg-[#f9f9f9]">
              <ShowPhoto
                :size="12"
                text-size="12rpx"
                :images="item.image"
                height="120rpx"
                width="120rpx"
              />
            </view>
            <view class="flex-1 flex flex-col justify-between h-[120rpx] py-[4rpx]">
              <view class="flex flex-col gap-[8rpx]">
                <text class="text-[30rpx] text-[#222] font-600 line-clamp-1">{{ item.name }}</text>
                <text class="text-[24rpx] text-[#999] line-clamp-1">{{ item.desc }}</text>
              </view>
              <view class="flex items-baseline gap-[6rpx]">
                <text class="text-[24rpx] text-[#e8403a] font-bold">¥</text>
                <text class="text-[36rpx] text-[#e8403a] font-bold">{{ item.price }}</text>
              </view>
            </view>
            <view class="pl-[16rpx]" @click.stop>
              <u-button
                type="error"
                shape="circle"
                :custom-style="{
                  height: '60rpx',
                  padding: '0 36rpx',
                  fontSize: '26rpx',
                  fontWeight: '500',
                  margin: '0',
                }"
                @click="handleBooking(item)"
                >预约</u-button
              >
            </view>
          </view>
          <!-- 规格明细 -->
          <view v-if="item.specs.length > 0" class="mt-[16rpx]">
            <view class="flex items-center justify-between py-[12rpx]" @click="toggleSpec(index)">
              <text class="text-[24rpx] text-[#999]">套餐包含（{{ item.specs.length }}项）</text>
              <up-icon
                :name="expandedSpecs[index] ? 'arrow-up' : 'arrow-down'"
                size="14"
                color="#999"
              ></up-icon>
            </view>
            <view v-if="expandedSpecs[index]" class="bg-[#f9f9f9] rounded-[12rpx] p-[20rpx]">
              <view
                v-for="(spec, sIdx) in item.specs"
                :key="sIdx"
                class="flex items-center justify-between py-[8rpx]"
                :class="sIdx !== item.specs.length - 1 ? 'border-b border-[#eee]' : ''"
              >
                <text class="text-[24rpx] text-[#444]">{{ spec.name }}</text>
                <text class="text-[24rpx] text-[#e8403a]">¥{{ spec.price }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 门店技师 -->
    <view v-if="techList.length > 0" class="mx-[24rpx] mb-[24rpx]">
      <view class="flex items-center gap-[12rpx] mb-[16rpx] px-[8rpx]">
        <view class="w-[8rpx] h-[30rpx] bg-[#e8403a] rounded-full"></view>
        <text class="text-[32rpx] font-bold text-[#222]">门店成员</text>
      </view>
      <view class="bg-white rounded-[24rpx] p-[30rpx] shadow-sm">
        <scroll-view scroll-x class="w-full whitespace-nowrap">
          <view class="flex gap-[24rpx]">
            <view
              v-for="item in techList"
              :key="item.id"
              class="flex flex-col items-center gap-[12rpx] w-[140rpx] flex-shrink-0"
            >
              <view class="relative">
                <image
                  :src="item.avatarUrl || ''"
                  class="w-[96rpx] h-[96rpx] rounded-full bg-[#f5f5f5]"
                  mode="aspectFill"
                />
                <view
                  class="absolute right-0 bottom-0 w-[20rpx] h-[20rpx] rounded-full border-2 border-white"
                  :class="item.workStatus === 2 ? 'bg-[#ff9900]' : 'bg-[#19be6b]'"
                ></view>
              </view>
              <text class="text-[26rpx] text-[#444] font-500 truncate w-full text-center">{{
                item.name
              }}</text>
              <text
                class="text-[22rpx] text-[#999] bg-[#f5f5f5] px-[12rpx] py-[4rpx] rounded-full"
                >{{ mapStaffRole(item.role) }}</text
              >
              <!-- <text
                class="text-[20rpx] px-[10rpx] py-[2rpx] rounded-full"
                :class="
                  item.workStatus === 1
                    ? 'text-[#ff9900] bg-[#fff8eb]'
                    : 'text-[#19be6b] bg-[#edfff3]'
                "
                >{{ item.workStatus === 1 ? '忙碌' : '空闲' }}</text
              > -->
            </view>
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 门店评价 -->
    <view class="mx-[24rpx] mb-[40rpx]">
      <view class="flex items-center gap-[12rpx] mb-[16rpx] px-[8rpx]">
        <view class="w-[8rpx] h-[30rpx] bg-[#e8403a] rounded-full"></view>
        <text class="text-[32rpx] font-bold text-[#222]">门店评价</text>
      </view>
      <view class="bg-white rounded-[24rpx] p-[20rpx] shadow-sm">
        <LoadingMore
          ref="commentListRef"
          height="auto"
          :api="fetchCommentList"
          :params="commentParams"
          :limit="10"
          :immediate="false"
          :refresher-enabled="false"
          empty-mode="message"
          empty-text="暂无评价"
        >
          <template #item="{ item, index }">
            <view
              :class="[
                'flex gap-[20rpx] p-[20rpx] transition-colors',
                index !== 0 ? 'border-t border-[#f5f5f5]' : '',
              ]"
            >
              <image
                :src="(item as unknown as CommentListItem).avatar"
                class="w-[80rpx] h-[80rpx] rounded-full flex-shrink-0 bg-[#f5f5f5]"
                mode="aspectFill"
              ></image>
              <view class="flex-1 flex flex-col gap-[12rpx]">
                <view class="flex justify-between items-start">
                  <view class="flex flex-col gap-[6rpx]">
                    <text class="text-[28rpx] font-600 text-[#222]">{{
                      (item as unknown as CommentListItem).nickname || '匿名用户'
                    }}</text>
                    <view class="flex items-center gap-[8rpx]">
                      <up-rate
                        :model-value="(item as unknown as CommentListItem).star ?? 5"
                        :size="14"
                        active-color="#f5a623"
                        :gutter="2"
                        readonly
                      />
                      <text class="text-[22rpx] text-[#f5a623] font-500"
                        >{{ ((item as unknown as CommentListItem).star ?? 5).toFixed(1) }}分</text
                      >
                    </view>
                  </view>
                  <text class="text-[22rpx] text-[#999] mt-[4rpx]">{{
                    formatDate((item as unknown as CommentListItem).addTime)
                  }}</text>
                </view>

                <text class="text-[28rpx] text-[#444] leading-relaxed mt-[4rpx]">{{
                  (item as unknown as CommentListItem).content || '该用户未填写文字评价'
                }}</text>

                <!-- 评价图片 -->
                <view
                  v-if="getCommentImages(item as unknown as CommentListItem).length > 0"
                  class="flex flex-wrap gap-[16rpx] mt-[8rpx]"
                >
                  <image
                    v-for="(pic, picIndex) in getCommentImages(item as unknown as CommentListItem)"
                    :key="picIndex"
                    :src="pic"
                    class="w-[180rpx] h-[180rpx] rounded-[12rpx] bg-[#f5f5f5]"
                    mode="aspectFill"
                    @click="
                      previewImage(getCommentImages(item as unknown as CommentListItem), picIndex)
                    "
                  ></image>
                </view>

                <!-- 商家回复 -->
                <view
                  v-if="(item as unknown as CommentListItem).adminContent"
                  class="mt-[12rpx] bg-[#f9f9f9] rounded-[12rpx] p-[20rpx]"
                >
                  <text class="text-[24rpx] text-[#e8403a] font-500">商家回复：</text>
                  <text class="text-[24rpx] text-[#666]">{{
                    (item as unknown as CommentListItem).adminContent
                  }}</text>
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
  import { ref, computed, watch } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import { useRequest } from 'alova/client'
  import { getStoreDetail } from '@/api/CarStoreService'
  import { getCommentList1 } from '@/api/Comment'
  import { addOrDeleteCollect } from '@/api/FavoriteService'
  import type { StoreDetailInfo, CarStoreServiceItem } from '@/api/CarStoreService/interfaces'
  import type { CommentListItem } from '@/api/Comment/interfaces'
  import { useLoading } from '@/hooks/useLoading'
  import ShowPhoto from '@/components/ShowPhoto/index.vue'
  import { dataFromMat } from '@/utils/dataFromMat'
  import { useUserStore } from '@/store/user'

  const userStore = useUserStore()

  const storeId = ref<string | number>('')
  const commentListRef = ref<InstanceType<typeof LoadingMore> | null>(null)
  const collectLoading = ref(false)

  const {
    loading,
    data,
    send: fetchStoreDetail,
  } = useRequest(
    () =>
      getStoreDetail({
        id: Number(storeId.value),
        latitude: userStore.location.lat,
        longitude: userStore.location.lng,
      }),
    {
      immediate: false,
      initialData: {},
    }
  )

  useLoading(loading)

  onLoad(options => {
    if (options && options.id) {
      storeId.value = options.id
      fetchStoreDetail()
    }
  })

  // 处理接口返回数据
  const storeInfo = computed(() => {
    if (!data.value) return null
    const detailData = (data.value as any).data || data.value
    return detailData as StoreDetailInfo
  })

  const storeName = computed(() => storeInfo.value?.realTimeInfo?.stores?.name || '')
  const storeAddress = computed(() => storeInfo.value?.realTimeInfo?.stores?.address || '')
  const storeDistance = computed(() => {
    const dist = storeInfo.value?.realTimeInfo?.distance || 0
    return dist > 1000 ? `${(dist / 1000).toFixed(1)}km` : `${dist}m`
  })
  const businessHours = computed(() => {
    const times = storeInfo.value?.realTimeInfo?.businessTime
    if (times && times.length > 0 && times[0].length > 0) {
      return `营业：${times[0].join('-')}`
    }
    return '营业时间：暂无'
  })

  const tags = computed(() => {
    return dataFromMat(storeInfo.value?.realTimeInfo?.stores?.serverTag || '')
  })

  // 服务列表
  const serviceList = computed(() => {
    const list = storeInfo.value?.carStoreServicesList || []
    return list.map((item: CarStoreServiceItem) => ({
      name: item.name || '服务项目',
      desc: item.brief || '暂无详细描述',
      price: item.price || '0',
      image: item.picUrl,
      id: item.id,
      serviceCode: item.serviceCode || '',
      specs: parseSpecs(item.specifications),
    }))
  })

  const parseSpecs = (str?: string): { name: string; price: number }[] => {
    if (!str) return []
    try {
      const arr = JSON.parse(str)
      return Array.isArray(arr) ? arr : []
    } catch {
      return []
    }
  }

  const expandedSpecs = ref<Record<number, boolean>>({})

  const toggleSpec = (index: number) => {
    expandedSpecs.value[index] = !expandedSpecs.value[index]
  }

  // 技师列表
  const techList = computed(() => {
    return storeInfo.value?.carUserStaffList || []
  })

  const STAFF_ROLE_MAP: Record<string, string> = {
    '1': '店长',
    '2': '技师',
    '3': '接待',
  }
  const mapStaffRole = (role?: string) => STAFF_ROLE_MAP[role ?? ''] ?? '员工'

  // ========== 评论相关 ==========
  const commentParams = computed(() => ({
    type: 2,
    storeId: Number(storeId.value),
  }))

  const fetchCommentList = (params: Record<string, unknown>) => {
    return getCommentList1({
      type: params.type as number,
      storeId: params.storeId as number,
      page: params.page as number,
      limit: params.limit as number,
    })
  }

  // 店铺详情加载完成后加载评论
  watch(storeInfo, newVal => {
    if (newVal && storeId.value) {
      commentListRef.value?.fetchList('init')
    }
  })

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return ''
    return dateStr.split(' ')[0]
  }

  const getCommentImages = (item: CommentListItem): string[] => {
    if (!item.hasPicture) return []
    if (Array.isArray(item.picUrls)) return item.picUrls.filter(Boolean)
    if (!item.picUrl) return []
    try {
      const pics = JSON.parse(item.picUrl)
      return Array.isArray(pics) ? pics : []
    } catch {
      return []
    }
  }

  const previewImage = (urls: string[], current: number) => {
    uni.previewImage({
      urls,
      current,
    })
  }

  const handleBooking = (item: { id: number; serviceCode: string }) => {
    const query = [
      `serviceCode=${encodeURIComponent(item.serviceCode)}`,
      `storeId=${storeId.value}`,
      `storeName=${encodeURIComponent(storeName.value)}`,
      `storeServiceId=${item.id}`,
    ].join('&')
    uni.navigateTo({ url: `/pages_client/pages/service/booking/index?${query}` })
  }

  // ========== 导航功能 ==========
  const handleNavigation = () => {
    const stores = storeInfo.value?.realTimeInfo?.stores
    if (!stores?.latitude || !stores?.longitude) {
      uni.showToast({ title: '暂无位置信息', icon: 'none' })
      return
    }
    uni.openLocation({
      latitude: stores.latitude,
      longitude: stores.longitude,
      name: stores.name || '店铺位置',
      address: stores.address || '',
      fail: () => {
        uni.showToast({ title: '打开导航失败', icon: 'none' })
      },
    })
  }

  // ========== 电话功能 ==========
  const handleCall = () => {
    const phone = storeInfo.value?.realTimeInfo?.stores?.phone
    if (!phone) {
      uni.showToast({ title: '暂无联系电话', icon: 'none' })
      return
    }
    uni.makePhoneCall({
      phoneNumber: phone,
      fail: () => {
        uni.showToast({ title: '拨打电话失败', icon: 'none' })
      },
    })
  }

  // ========== 收藏功能 ==========
  const handleToggleCollect = async () => {
    if (collectLoading.value || !storeId.value) return
    collectLoading.value = true
    try {
      await addOrDeleteCollect({
        type: 2,
        valueId: Number(storeId.value),
      })
      data.value.isCollect = !data.value.isCollect
      uni.showToast({
        title: data.value.isCollect ? '已收藏' : '已取消收藏',
        icon: 'success',
      })
    } catch {
      uni.showToast({ title: '操作失败', icon: 'none' })
    } finally {
      collectLoading.value = false
    }
  }

  const handleToDetails = (item: CarStoreServiceItem) => {
    uni.navigateTo({ url: `/pages_client/pages/service/details/index?id=${item.id}` })
  }
</script>
