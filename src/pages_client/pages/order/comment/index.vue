<template>
  <DefaultLayout>
    <view class="min-h-100vh bg-[#f6f6f6] pb-[160rpx]">
      <!-- 评价内容 -->
      <view class="bg-white rounded-[16rpx] mx-[24rpx] mt-[20rpx] p-[20rpx]">
        <up-textarea
          v-model="content"
          placeholder="请输入您的宝贵评价"
          height="180"
          count
          maxlength="500"
        ></up-textarea>
      </view>

      <!-- 评分 -->
      <view class="bg-white rounded-[16rpx] mx-[24rpx] mt-[20rpx] p-[20rpx]">
        <view class="flex items-center justify-between py-[12rpx]">
          <text class="text-[28rpx] text-[#333]">评分</text>
          <view class="flex items-center gap-[16rpx]">
            <up-rate v-model="star" active-color="#f5a623"></up-rate>
            <text class="text-[28rpx] text-[#f05a57] font-600">{{ star }}分</text>
          </view>
        </view>
      </view>

      <!-- 是否上传图片开关 -->
      <view class="bg-white rounded-[16rpx] mx-[24rpx] mt-[20rpx] p-[20rpx]">
        <view class="flex items-center justify-between">
          <text class="text-[28rpx] text-[#333]">添加图片</text>
          <up-switch v-model="hasPicture" active-color="#e8403a"></up-switch>
        </view>
      </view>

      <!-- 上传图片区域（hasPicture 为 true 时显示） -->
      <view v-if="hasPicture" class="bg-white rounded-[16rpx] mx-[24rpx] mt-[20rpx] p-[20rpx]">
        <text class="text-[26rpx] text-[#666] mb-[16rpx] block">上传图片</text>
        <view class="flex flex-wrap gap-[16rpx]">
          <view
            v-for="(url, idx) in uploadedUrls"
            :key="idx"
            class="relative w-[160rpx] h-[160rpx]"
          >
            <image :src="url" class="w-full h-full rounded-[12rpx]" mode="aspectFill" />
            <view
              class="absolute -top-[10rpx] -right-[10rpx] w-[36rpx] h-[36rpx] rounded-50% bg-[#e8403a] flex items-center justify-center"
              @click="removeUrl(idx)"
            >
              <up-icon name="close" size="14" color="#fff"></up-icon>
            </view>
          </view>
          <view
            v-if="uploadedUrls.length < 9"
            class="w-[160rpx] h-[160rpx] rounded-[12rpx] bg-[#f2f2f2] flex flex-col items-center justify-center"
            @click="handleChooseImage"
          >
            <up-icon name="camera" size="40" color="#bbb"></up-icon>
            <text class="text-[22rpx] text-[#bbb] mt-[8rpx]">添加图片</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view
      class="fixed left-0 right-0 bottom-0 bg-white px-[24rpx] py-[20rpx] pb-[30rpx] flex gap-[20rpx]"
      style="box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05)"
    >
      <up-button
        type="error"
        size="normal"
        shape="circle"
        color="#d63b35"
        :loading="submitting"
        :disabled="!canSubmit"
        class="flex-1"
        @click="handleSubmit"
      >
        发表评价
      </up-button>
    </view>
  </DefaultLayout>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import DefaultLayout from '@/components/DefaultLayout/index.vue'
  import { commentOrder } from '@/api/OrderService'
  import { useUploadImage } from '@/hooks/useUploadImage'

  const orderId = ref(0)
  const content = ref('')
  const star = ref(5)
  const hasPicture = ref(false)
  const submitting = ref(false)

  const { uploadedUrls, chooseAndUpload, removeUrl, clear } = useUploadImage({ maxCount: 9 })

  // 关闭图片开关时清空已上传图片
  watch(hasPicture, val => {
    if (!val) {
      clear()
    }
  })

  const canSubmit = computed(() => content.value.trim().length > 0)

  const handleChooseImage = async () => {
    try {
      await chooseAndUpload()
    } catch {
      /* 用户取消或上传失败 */
    }
  }

  const handleSubmit = async () => {
    if (!canSubmit.value) {
      uni.showToast({ title: '请输入评价内容', icon: 'none' })
      return
    }

    // 开启了图片但未上传时提示
    if (hasPicture.value && uploadedUrls.value.length === 0) {
      uni.showToast({ title: '请上传图片或关闭图片开关', icon: 'none' })
      return
    }

    submitting.value = true
    try {
      await commentOrder({
        orderId: orderId.value,
        content: content.value.trim(),
        star: star.value,
        hasPicture: hasPicture.value,
        picUrls: hasPicture.value ? uploadedUrls.value : undefined,
      })
      uni.showToast({ title: '评价成功', icon: 'success' })
      setTimeout(() => uni.navigateBack(), 1500)
    } catch {
      uni.showToast({ title: '评价失败', icon: 'none' })
    } finally {
      submitting.value = false
    }
  }

  onLoad(options => {
    if (options?.orderId) {
      orderId.value = Number(options.orderId)
    }
  })
</script>
