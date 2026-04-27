<template>
  <DefaultLayout>
    <view class="relative">
      <ShowPhoto height="500rpx" :images="galleryList" />
    </view>
    <view
      class="bg-white rounded-[24rpx] mx-[24rpx] mt-[-40rpx] mb-[24rpx] p-[30rpx] relative z-10 shadow-sm"
    >
      <view class="flex justify-between items-start">
        <view class="flex flex-col gap-[12rpx] flex-1">
          <text class="text-[40rpx] font-bold text-[#111] leading-tight">{{ info.name }}</text>
          <PriceDisplay :price="info.price" :cost-price="info.costPrice" size="lg" />
        </view>
        <view class="bg-[#f0f7ff] px-[20rpx] py-[8rpx] rounded-[8rpx]">
          <text class="text-[22rpx] text-[#2b85e4] font-500">标准服务</text>
        </view>
      </view>

      <view class="mt-[24rpx] p-[20rpx] bg-[#f8f8f8] rounded-[12rpx]">
        <text class="text-[26rpx] text-[#666] leading-[1.6]">{{ info.brief }}</text>
      </view>

      <view
        class="mt-[30rpx] flex items-center justify-between border-t border-[#f2f2f2] pt-[24rpx]"
      >
        <view
          v-for="tag in ['专业技师', '标准流程', '质保无忧']"
          :key="tag"
          class="flex items-center gap-[8rpx]"
        >
          <up-icon name="checkmark-circle-fill" color="#19be6b" size="24"></up-icon>
          <text class="text-[24rpx] text-[#666]">{{ tag }}</text>
        </view>
      </view>
    </view>

    <view v-if="specList.length > 0" class="mx-[24rpx] mb-[24rpx]">
      <view class="flex items-center gap-[12rpx] mb-[16rpx] px-[8rpx]">
        <view class="w-[8rpx] h-[30rpx] bg-[#e8403a] rounded-full"></view>
        <text class="text-[32rpx] font-bold text-[#222]">服务包含</text>
      </view>
      <view class="bg-white rounded-[24rpx] p-[24rpx] shadow-sm">
        <view
          v-for="(spec, index) in specList"
          :key="index"
          class="flex items-center justify-between py-[20rpx]"
          :class="index !== specList.length - 1 ? 'border-b border-[#f5f5f5]' : ''"
        >
          <view class="flex items-center gap-[16rpx]">
            <view class="w-[12rpx] h-[12rpx] bg-[#ddd] rounded-full"></view>
            <text class="text-[28rpx] text-[#444]">{{ spec.name }}</text>
          </view>
          <text class="text-[28rpx] text-[#e8403a] font-500">x 1</text>
        </view>
      </view>
    </view>

    <view class="mx-[24rpx] mb-[40rpx]">
      <view class="flex items-center gap-[12rpx] mb-[16rpx] px-[8rpx]">
        <view class="w-[8rpx] h-[30rpx] bg-[#e8403a] rounded-full"></view>
        <text class="text-[32rpx] font-bold text-[#222]">详情说明</text>
      </view>
      <view class="bg-white rounded-[24rpx] p-[30rpx] shadow-sm overflow-hidden">
        <view class="detail-rich-text">
          <rich-text :nodes="info.detail || '暂无详细描述'" />
        </view>
      </view>
    </view>

    <view
      class="fixed bottom-0 left-0 right-0 bg-white border-t border-[#f2f2f2] px-[40rpx] py-[20rpx] pb-safe flex items-center justify-between z-50"
    >
      <view class="flex flex-col">
        <view class="flex items-baseline gap-[4rpx]">
          <text class="text-[24rpx] text-[#e8403a] font-bold">¥</text>
          <text class="text-[44rpx] text-[#e8403a] font-bold">{{ info.price }}</text>
        </view>
        <text class="text-[22rpx] text-[#999]">专业施工 · 售后保障</text>
      </view>

      <u-button
        v-if="userStore.role === UserRole.CLIENT"
        type="error"
        shape="circle"
        :custom-style="{
          width: '320rpx',
          height: '88rpx',
          fontSize: '30rpx',
          fontWeight: 'bold',
          background: 'linear-gradient(90deg, #ff6b6b 0%, #e8403a 100%)',
          border: 'none',
          margin: '0',
        }"
        @click="handleBooking"
      >
        立即预约
      </u-button>
    </view>
  </DefaultLayout>
</template>

<script setup lang="ts">
  import DefaultLayout from '@/components/DefaultLayout/index.vue'
  import ShowPhoto from '@/components/ShowPhoto/index.vue'
  import PriceDisplay from '@/components/PriceDisplay/index.vue'
  import { ref, computed } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import { useRequest } from 'alova/client'
  import { getServiceDetail } from '@/api/CarStoreService'
  import { UserRole } from '@/store/user'
  import { useUserStore } from '@/store/user'

  const userStore = useUserStore()

  const serviceId = ref<string | number>('')

  // 1. 获取详情数据
  const { data, send: fetchDetail } = useRequest(getServiceDetail, {
    immediate: false,
    initialData: {},
  })

  onLoad(options => {
    if (options?.id) {
      serviceId.value = options.id
      fetchDetail({
        id: Number(serviceId.value),
      })
    }
  })

  // 2. 响应式处理数据
  const info = computed(() => {
    // 兼容可能存在的 data 包装层
    return (data.value as any)?.data || data.value || {}
  })

  // 3. 处理轮播图
  const galleryList = computed(() => {
    try {
      if (!info.value.gallery) return [info.value.picUrl]
      const arr = JSON.parse(info.value.gallery)
      return Array.isArray(arr) ? arr : [info.value.picUrl]
    } catch {
      return [info.value.picUrl]
    }
  })

  // 4. 处理规格明细
  const specList = computed(() => {
    try {
      if (!info.value.specifications) return []
      const arr = JSON.parse(info.value.specifications)
      return Array.isArray(arr) ? arr : []
    } catch {
      return []
    }
  })

  const handleBooking = () => {
    // 跳转到你写好的预约界面，传递必要参数
    uni.navigateTo({
      url: `/pages_client/pages/service/booking/index?storeServiceId=${info.value.id}&serviceCode=${info.value.serviceCode}&storeId=${info.value.storeId}`,
    })
  }
</script>

<style scoped>
  /* 适配 iPhone 底部安全区 */
  .pb-safe {
    padding-bottom: calc(20rpx + constant(safe-area-inset-bottom));
    padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  }

  /* 富文本样式美化 */
  .detail-rich-text :deep(img),
  .detail-rich-text :deep(image) {
    width: 100% !important;
    height: auto !important;
    border-radius: 12rpx;
    margin: 10rpx 0;
    display: block;
  }

  .detail-rich-text :deep(p) {
    font-size: 28rpx;
    color: #444;
    line-height: 1.6;
    margin-bottom: 12rpx;
  }
</style>
