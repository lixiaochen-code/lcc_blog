<template>
  <DefaultLayout>
    <view class="flex flex-col h-full">
      <view class="flex-1 h-0 px-[24rpx] pt-[20rpx]">
        <LoadingMore
          ref="listRef"
          :height="'100%'"
          :api="fetchCommentList"
          :params="queryParams"
          :limit="10"
          empty-mode="message"
          empty-text="暂无评价记录"
        >
          <template #item="{ item }">
            <view
              class="bg-white rounded-[16rpx] p-[24rpx] mb-[20rpx] border border-solid border-[#f3f3f3]"
              @click="handleGoOrderDetail(item as unknown as CommentListItem)"
            >
              <!-- 用户信息 -->
              <view class="flex items-center justify-between mb-[20rpx]">
                <view class="flex items-center gap-[16rpx]">
                  <image
                    :src="userStore.userData?.avatar || ''"
                    class="w-[72rpx] h-[72rpx] rounded-full flex-shrink-0 bg-[#f5f5f5]"
                    mode="aspectFill"
                  />
                  <view class="flex flex-col gap-[6rpx]">
                    <text class="text-[28rpx] text-[#333] font-500">{{
                      (item as unknown as CommentListItem).nickname || '匿名用户'
                    }}</text>
                    <view class="flex items-center gap-[8rpx]">
                      <up-rate
                        :model-value="(item as unknown as CommentListItem).star ?? 0"
                        :size="12"
                        active-color="#f5a623"
                        :gutter="2"
                        readonly
                      />
                      <text class="text-[22rpx] text-[#f5a623] font-500">
                        {{ ((item as unknown as CommentListItem).star ?? 0).toFixed(1) }}分
                      </text>
                    </view>
                  </view>
                </view>
                <text class="text-[24rpx] text-[#999]">{{
                  formatDate((item as unknown as CommentListItem).addTime)
                }}</text>
              </view>

              <!-- 门店信息 -->
              <view
                v-if="(item as unknown as CommentListItem).objName"
                class="flex items-center justify-between mb-[16rpx] bg-[#f9f9f9] rounded-[8rpx] p-[16rpx]"
                @click.stop="handleGoStore((item as unknown as CommentListItem).storeId)"
              >
                <view class="flex items-center gap-[12rpx]">
                  <image
                    v-if="(item as unknown as CommentListItem).storePicUrl"
                    :src="(item as unknown as CommentListItem).storePicUrl"
                    class="w-[64rpx] h-[64rpx] rounded-[8rpx] flex-shrink-0 bg-[#eee]"
                    mode="aspectFill"
                  />
                  <view
                    v-else
                    class="w-[64rpx] h-[64rpx] rounded-[8rpx] flex-shrink-0 bg-[#eee] flex items-center justify-center"
                  >
                    <up-icon name="home" size="18" color="#999"></up-icon>
                  </view>
                  <text class="text-[24rpx] text-[#666]">{{
                    (item as unknown as CommentListItem).objName
                  }}</text>
                </view>
                <up-icon name="arrow-right" size="14" color="#ccc"></up-icon>
              </view>

              <!-- 评价内容 -->
              <text class="text-[28rpx] text-[#333] leading-[1.6] block mb-[16rpx]">{{
                (item as unknown as CommentListItem).content || '用户暂未填写评价内容'
              }}</text>

              <!-- 评价图片 -->
              <view
                v-if="getCommentImages(item as unknown as CommentListItem).length > 0"
                class="flex flex-wrap gap-[12rpx] mb-[16rpx]"
              >
                <image
                  v-for="(pic, picIndex) in getCommentImages(item as unknown as CommentListItem)"
                  :key="picIndex"
                  :src="pic"
                  class="w-[160rpx] h-[160rpx] rounded-[8rpx]"
                  mode="aspectFill"
                  @click="
                    previewImage(getCommentImages(item as unknown as CommentListItem), picIndex)
                  "
                ></image>
              </view>

              <!-- 商家回复 -->
              <view
                v-if="(item as unknown as CommentListItem).adminContent"
                class="bg-[#f9f9f9] rounded-[8rpx] p-[16rpx]"
              >
                <text class="text-[24rpx] text-[#e8403a] font-500">商家回复：</text>
                <text class="text-[24rpx] text-[#666]">{{
                  (item as unknown as CommentListItem).adminContent
                }}</text>
              </view>

              <view
                v-if="(item as unknown as CommentListItem).orderId"
                class="mt-[16rpx] pt-[16rpx] border-t border-solid border-[#f5f5f5] flex items-center justify-between"
              >
                <text class="text-[22rpx] text-[#999]">查看对应订单详情</text>
                <view class="flex items-center gap-[6rpx] text-[#e8403a]">
                  <text class="text-[24rpx]">查看订单</text>
                  <up-icon name="arrow-right" size="12" color="#e8403a"></up-icon>
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
  import { getCommentList1 } from '@/api/Comment'
  import type { CommentListItem } from '@/api/Comment/interfaces'
  import { useUserStore } from '@/store/user'

  const queryParams = ref({
    type: 2,
  })
  const userStore = useUserStore()

  const fetchCommentList = (params: Record<string, unknown>) => {
    return getCommentList1({
      type: params.type as number,
      page: params.page as number,
      limit: params.limit as number,
      userId: userStore.userId,
    })
  }

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

  const handleGoStore = (storeId?: string) => {
    if (!storeId) return
    uni.navigateTo({ url: `/pages_client/pages/store/detail/index?id=${storeId}` })
  }

  const handleGoOrderDetail = (item: CommentListItem) => {
    if (!item.orderId) return
    uni.navigateTo({ url: `/pages_client/pages/order/detail/index?orderId=${item.orderId}` })
  }
</script>
