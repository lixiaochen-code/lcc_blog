<template>
  <root-portal>
    <up-popup :show="show" mode="bottom" round="20" :safe-area-inset-bottom="false" @close="close">
      <view class="flex flex-col bg-white rounded-t-[20rpx]">
        <!-- 标题栏 -->
        <view
          class="p-[30rpx] flex justify-between items-center border-b border-solid border-[#eee]"
        >
          <text class="text-[32rpx] font-600 text-[#222]">取消订单</text>
          <up-icon name="close" size="22" color="#999" @click="close"></up-icon>
        </view>

        <!-- 内容区 -->
        <view class="p-[30rpx]">
          <text class="text-[26rpx] text-[#666] mb-[16rpx] block">取消原因</text>
          <up-textarea
            v-model="reason"
            placeholder="请输入取消原因"
            count
            maxlength="200"
            height="200"
          ></up-textarea>
        </view>

        <!-- 底部按钮 -->
        <view
          class="p-[30rpx] pt-0"
          style="padding-bottom: calc(30rpx + env(safe-area-inset-bottom))"
        >
          <up-button
            type="error"
            shape="circle"
            color="#d63b35"
            :loading="submitting"
            @click.stop="handleSubmit"
          >
            确认取消
          </up-button>
        </view>
      </view>
    </up-popup>
  </root-portal>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'

  const props = defineProps<{
    show: boolean
  }>()

  const emit = defineEmits<{
    (e: 'update:show', val: boolean): void
    (e: 'confirm', reason: string): void
  }>()

  const reason = ref('')
  const submitting = ref(false)

  watch(
    () => props.show,
    val => {
      if (val) {
        reason.value = ''
        submitting.value = false
      }
    }
  )

  const close = () => {
    emit('update:show', false)
  }

  const handleSubmit = () => {
    submitting.value = true
    emit('confirm', reason.value.trim())
  }

  defineExpose({ stopLoading: () => (submitting.value = false) })
</script>
