<template>
  <DefaultLayout>
    <view class="content">
      <image class="qrcode" :src="qrCode" mode="aspectFit"></image>
      <text class="guide-title">使用说明</text>
      <view class="guide-list">
        <text class="guide-item">1、向服务人员出示此二维码</text>
        <text class="guide-item">2、每个二维码仅可使用一次</text>
      </view>
    </view>
  </DefaultLayout>
</template>

<script setup lang="ts">
  import DefaultLayout from '@/components/DefaultLayout/index.vue'
  import { onLoad } from '@dcloudio/uni-app'
  import { ref } from 'vue'

  const qrCode = ref('')

  onLoad(options => {
    if (options?.qrCode) {
      qrCode.value = decodeURIComponent(options.qrCode)
    }
  })
</script>

<style lang="scss" scoped>
  .content {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 60rpx;
  }

  .qrcode {
    width: 440rpx;
    height: 440rpx;
    border: 2rpx solid #eee;
    padding: 20rpx;
    border-radius: 12rpx;
  }

  .guide-title {
    font-size: 30rpx;
    font-weight: 600;
    margin-top: 40rpx;
    color: #222;
  }

  .guide-list {
    margin-top: 20rpx;
    display: flex;
    flex-direction: column;
    gap: 12rpx;
    color: #666;
    font-size: 24rpx;
  }
</style>
