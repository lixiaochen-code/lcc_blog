<template>
  <DefaultLayout>
    <view class="flex flex-col h-full">
      <!-- 收藏列表 -->
      <view class="flex-1 h-0 px-[24rpx] pt-[20rpx]">
        <LoadingMore
          ref="loadingMoreRef"
          :height="'100%'"
          :api="fetchCollectList"
          :limit="10"
          empty-mode="favor"
          empty-text="暂无收藏内容"
        >
          <template #item="{ item }">
            <view
              class="bg-white rounded-[16rpx] p-[20rpx] mb-[20rpx] flex gap-[20rpx]"
              @click="handleItemClick(item)"
            >
              <!-- 封面图 -->
              <image
                :src="asCollect(item).picUrl || defaultImage"
                class="w-[180rpx] h-[180rpx] rounded-[12rpx] flex-shrink-0 bg-gray-100"
                mode="aspectFill"
              ></image>

              <!-- 内容 -->
              <view class="flex-1 flex flex-col justify-between py-[4rpx]">
                <view>
                  <text class="text-[28rpx] font-600 text-[#222] line-clamp-1">
                    {{ asCollect(item).storeName || asCollect(item).name }}
                  </text>
                  <text class="text-[24rpx] text-[#999] mt-[8rpx] block line-clamp-2">
                    {{ asCollect(item).storeAddress || asCollect(item).brief || '暂无描述' }}
                  </text>
                </view>
                <view class="flex items-center justify-between mt-[12rpx]">
                  <view>
                    <text
                      v-if="asCollect(item).retailPrice"
                      class="text-[30rpx] font-600 text-[#e8403a]"
                    >
                      ¥{{ asCollect(item).retailPrice }}
                    </text>
                  </view>
                  <view
                    class="flex items-center gap-[6rpx]"
                    @click.stop="handleCancelCollect(asCollect(item))"
                  >
                    <up-icon name="heart-fill" size="20" color="#e8403a"></up-icon>
                    <text class="text-[22rpx] text-[#999]">取消收藏</text>
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
  import { ref } from 'vue'
  import { getCollectList, addOrDeleteCollect } from '@/api/FavoriteService'
  import type { CollectItem } from '@/api/FavoriteService/interfaces'

  const defaultImage = 'https://cdn.uviewui.com/uview/album/1.jpg'

  const loadingMoreRef = ref<InstanceType<typeof LoadingMore>>()

  // ========== 类型断言辅助 ==========
  const asCollect = (item: unknown) => item as CollectItem

  // ========== 请求适配 ==========
  const fetchCollectList = (params: any) => {
    return getCollectList({
      ...params,
      type: 2,
    })
  }

  // ========== 取消收藏 ==========
  const handleCancelCollect = (item: CollectItem) => {
    uni.showModal({
      title: '提示',
      content: `确定取消收藏"${item.storeName || item.name}"吗？`,
      success: async res => {
        if (res.confirm) {
          try {
            await addOrDeleteCollect({
              type: item.type,
              valueId: item.valueId,
            })
            uni.showToast({ title: '已取消收藏', icon: 'success' })
            loadingMoreRef.value?.fetchList('refresh')
          } catch {
            uni.showToast({ title: '操作失败', icon: 'none' })
          }
        }
      },
    })
  }

  // ========== 点击收藏项 ==========
  const handleItemClick = (item: unknown) => {
    const collectItem = item as CollectItem
    if (collectItem.type === 1) {
      // 服务类型 - 暂无跳转
    } else if (collectItem.type === 2) {
      // 店铺类型 - 跳转到店铺详情
      uni.navigateTo({
        url: `/pages_client/pages/store/detail/index?id=${collectItem.valueId}`,
      })
    }
  }
</script>
