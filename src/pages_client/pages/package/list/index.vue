<template>
  <DefaultLayout>
    <!-- <up-navbar title="权益套餐" :placeholder="true" :safe-area-inset-top="true" /> -->
    <view class="px-24rpx pt-20rpx">
      <view
        v-for="item in handleList"
        :key="item.id"
        class="bg-white rounded-16rpx p-24rpx mb-20rpx"
        @click="handleItemClick(item)"
      >
        <view class="flex gap-20rpx">
          <ShowPhoto :images="item.picUrl" width="180rpx" height="180rpx" text-size="14rpx" />
          <view class="flex-1 flex flex-col justify-between overflow-hidden">
            <text class="text-30rpx font-600 text-[#222] truncate">{{ item.name }}</text>
            <text class="text-24rpx text-[#999] line-clamp-2">{{ item.brief || '暂无简介' }}</text>
            <PriceDisplay :price="item.price" :cost-price="item.costPrice" size="sm" />
          </view>
        </view>
      </view>

      <view v-if="loading" class="text-center py-40rpx text-24rpx text-[#999]">加载中...</view>
      <view
        v-else-if="isFinished && list.length > 0"
        class="text-center py-40rpx text-24rpx text-[#999]"
      >
        没有更多了
      </view>
      <view
        v-else-if="!loading && list.length === 0"
        class="text-center py-80rpx text-26rpx text-[#999]"
      >
        暂无套餐数据
      </view>
    </view>
  </DefaultLayout>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { onReachBottom } from '@dcloudio/uni-app'
  import { useRequest } from 'alova/client'
  import DefaultLayout from '@/components/DefaultLayout/index.vue'
  import ShowPhoto from '@/components/ShowPhoto/index.vue'
  import PriceDisplay from '@/components/PriceDisplay/index.vue'
  import { getPackageList } from '@/api/PackageService'
  import type { PackageServerItem } from '@/api/PackageService/interfaces'

  const list = ref<PackageServerItem[]>([])
  const page = ref(1)
  const isFinished = ref(false)

  const { loading, send } = useRequest(
    () => getPackageList({ pageNumber: page.value, pageSize: 10 }),
    { immediate: true }
  )

  // 首次加载
  send()
    .then(res => {
      const items = (res as any)?.data?.list ?? (res as any)?.list ?? []
      if (items.length > 0) {
        list.value = items
      } else {
        isFinished.value = true
      }
    })
    .catch(() => {
      uni.showToast({ title: '加载失败', icon: 'none' })
    })

  const handleList = computed(() => {
    return list.value.map(item => {
      try {
        return { ...item, picUrl: JSON.parse(item.picUrl)?.[0] || '' }
      } catch {
        return { ...item }
      }
    })
  })

  onReachBottom(async () => {
    if (isFinished.value || loading.value) return
    page.value++
    try {
      const res = await send()
      const items = (res as any)?.data?.list ?? (res as any)?.list ?? []
      if (items.length > 0) {
        list.value.push(...items)
      } else {
        isFinished.value = true
      }
    } catch {
      page.value--
    }
  })

  const handleItemClick = (item: PackageServerItem) => {
    uni.navigateTo({
      url: `/pages_client/pages/package/detail/index?id=${item.id}`,
    })
  }
</script>
