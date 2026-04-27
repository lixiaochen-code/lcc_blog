<template>
  <up-popup :show="show" mode="center" :round="16" :closeable="true" @close="emit('close')">
    <view
      v-if="show"
      class="flex w-[560rpx] flex-col items-center px-[40rpx] pb-[40rpx] pt-[60rpx]"
    >
      <text class="mb-[24rpx] text-[32rpx] font-700 text-[#222]">我的二维码</text>
      <image
        v-if="qrCodeUrl"
        :src="qrCodeUrl"
        class="mb-[32rpx] h-[400rpx] w-[400rpx]"
        mode="aspectFit"
      />
      <view v-else class="mb-[32rpx] flex h-[400rpx] w-[400rpx] items-center justify-center">
        <up-loading-icon :size="40"></up-loading-icon>
      </view>
      <button class="share-btn" open-type="share" :disabled="!qrCodeUrl">
        <up-button
          type="error"
          shape="circle"
          text="分享给好友"
          color="#e8403a"
          custom-style="width: 400rpx"
          :disabled="!qrCodeUrl"
        ></up-button>
      </button>
      <up-button
        type="error"
        plain
        shape="circle"
        text="查看图片"
        color="#e8403a"
        custom-style="width: 400rpx; margin-top: 20rpx"
        :disabled="!qrCodeUrl"
        @click="preview"
      ></up-button>
    </view>
  </up-popup>
</template>

<script setup lang="ts">
  const props = defineProps<{
    show: boolean
    qrCodeUrl: string
  }>()

  const emit = defineEmits<{
    close: []
  }>()

  const preview = () => {
    if (!props.qrCodeUrl) return
    uni.previewImage({ urls: [props.qrCodeUrl], current: props.qrCodeUrl })
  }
</script>

<style lang="scss" scoped>
  .share-btn {
    padding: 0;
    margin: 0;
    background: transparent;
    border: none;
    line-height: 1;
    font-size: 0;

    &::after {
      border: none;
    }
  }
</style>
