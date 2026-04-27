<template>
  <DefaultLayout>
    <view class="min-h-100vh bg-[#f6f6f6] pb-[120rpx]">
      <!-- Service Records List -->
      <view class="px-[24rpx] pt-[24rpx] flex flex-col gap-[24rpx]">
        <view
          v-for="(record, index) in recordList"
          :key="index"
          class="bg-white rounded-[16rpx] p-[24rpx]"
        >
          <view class="flex gap-[24rpx] mb-[32rpx]">
            <image
              :src="record.image"
              class="w-[140rpx] h-[140rpx] rounded-[12rpx] bg-gray-100"
              mode="aspectFill"
            ></image>
            <view class="flex-1 flex flex-col justify-between py-[4rpx]">
              <view class="flex justify-between items-start">
                <text class="text-[30rpx] font-600 text-[#222]">{{ record.serviceName }}</text>
                <up-tag text="已完成" type="success" size="mini" plain></up-tag>
              </view>
              <view class="text-[24rpx] text-[#666]">使用时间：{{ record.time }}</view>
              <view class="flex justify-between items-center">
                <text class="text-[24rpx] text-[#666]">客户：{{ record.customer }}</text>
                <text class="text-[32rpx] font-700 text-[#222]">¥ {{ record.price }}</text>
              </view>
            </view>
          </view>

          <view class="flex justify-end gap-[20rpx]">
            <up-button
              v-if="record.hasEvaluation"
              text="查看评价"
              size="mini"
              shape="circle"
              plain
              type="error"
              :custom-style="{ width: '160rpx', height: '56rpx', margin: '0' }"
            ></up-button>
            <up-button
              text="查看详情"
              size="mini"
              shape="circle"
              plain
              type="error"
              :custom-style="{ width: '160rpx', height: '56rpx', margin: '0' }"
            ></up-button>
          </view>
        </view>
      </view>
    </view>
  </DefaultLayout>
</template>

<script setup lang="ts">
  import DefaultLayout from '@/components/DefaultLayout/index.vue'
  import { ref } from 'vue'

  const recordList = ref([
    {
      serviceName: '标准洗车',
      image: 'https://cdn.uviewui.com/uview/swiper/swiper1.png',
      time: '2023-06-20 17:59:33',
      customer: '李女士',
      price: 500,
      hasEvaluation: false,
    },
    {
      serviceName: '标准洗车',
      image: 'https://cdn.uviewui.com/uview/swiper/swiper2.png',
      time: '2023-06-20 17:59:33',
      customer: '李女士',
      price: 500,
      hasEvaluation: false,
    },
    {
      serviceName: '标准洗车',
      image: 'https://cdn.uviewui.com/uview/swiper/swiper3.png',
      time: '2023-06-20 17:59:33',
      customer: '李女士',
      price: 500,
      hasEvaluation: true,
    },
  ])
</script>

<style lang="scss" scoped></style>
