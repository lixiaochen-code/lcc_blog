<template>
  <up-popup :show="visible" mode="center" round="16" :close-on-click-overlay="false">
    <view class="w-[560rpx] px-[40rpx] py-[48rpx] flex flex-col items-center">
      <text class="text-[32rpx] font-700 text-[#222] mb-[16rpx]">完善个人信息</text>
      <text class="text-[26rpx] text-[#999] mb-[48rpx]">为了更好地为您服务，请完善以下信息</text>

      <!-- 头像选择 -->
      <view class="flex items-center w-full mb-[32rpx]">
        <text class="text-[28rpx] text-[#333] w-[140rpx]">头像</text>
        <view>
          <button
            class="w-[100rpx] h-[100rpx] rounded-full overflow-hidden p-0 border-none bg-[#f5f5f5]"
            open-type="chooseAvatar"
            @chooseavatar="handleChooseAvatar"
          >
            <image
              v-if="avatarUrl"
              :src="avatarUrl"
              class="w-[100rpx] h-[100rpx] rounded-full"
              mode="aspectFill"
            />
            <up-icon v-else name="account" size="40" color="#ccc"></up-icon>
          </button>
          <up-icon
            v-if="avatarUrl"
            name="checkmark-circle-fill"
            size="20"
            color="#07c160"
            class="ml-[16rpx]"
          ></up-icon>
        </view>
      </view>

      <!-- 昵称输入 -->
      <view class="flex items-center w-full mb-[32rpx]">
        <text class="text-[28rpx] text-[#333] w-[140rpx]">昵称</text>
        <input
          type="nickname"
          class="flex-1 h-[72rpx] bg-[#f5f5f5] rounded-[12rpx] px-[20rpx] text-[28rpx]"
          placeholder="请输入昵称"
          :value="nicknameValue"
          @blur="handleNicknameBlur"
        />
        <up-icon
          v-if="nicknameValue"
          name="checkmark-circle-fill"
          size="20"
          color="#07c160"
          class="ml-[16rpx]"
        ></up-icon>
      </view>

      <!-- 手机号绑定 -->
      <view class="flex items-center w-full mb-[40rpx]">
        <text class="text-[28rpx] text-[#333] w-[140rpx]">手机号</text>
        <view v-if="phoneNumber" class="flex items-center flex-1">
          <text class="text-[28rpx] text-[#333]">{{ phoneNumber }}</text>
          <up-icon
            name="checkmark-circle-fill"
            size="20"
            color="#07c160"
            class="ml-[16rpx]"
          ></up-icon>
        </view>
        <button
          v-else
          class="flex-1 h-[72rpx] leading-[72rpx] text-[28rpx] text-white bg-[#07c160] rounded-[12rpx] border-none"
          open-type="getPhoneNumber"
          @getphonenumber="handleBindPhone"
        >
          授权手机号
        </button>
      </view>

      <!-- 取消按钮 -->
      <up-button
        type="info"
        plain
        shape="circle"
        text="跳过"
        :custom-style="{ width: '100%', height: '72rpx', fontSize: '28rpx' }"
        @click="handleCancel"
      ></up-button>
    </view>
  </up-popup>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { useUserStore } from '@/store/user'
  import { bindPhone } from '@/api/AccountManagement'
  import { getUserInfo, updateUserInfo } from '@/api/MemberService'
  import { uploadWxAvatar } from '@/hooks/useUploadImage'

  const props = defineProps<{
    show: boolean
  }>()

  const emit = defineEmits<{
    (e: 'update:show', val: boolean): void
    (e: 'cancel'): void
  }>()

  const userStore = useUserStore()
  const visible = ref(false)
  const avatarUrl = ref('')
  const nicknameValue = ref('')
  const phoneNumber = ref('')

  // 记录打开弹窗时的原始值，用于判断是否有变化
  const originalAvatar = ref('')
  const originalNickname = ref('')

  watch(
    () => props.show,
    val => {
      visible.value = val
      if (val) {
        syncFromStore()
      }
    }
  )

  const syncFromStore = () => {
    const user = userStore.userData
    avatarUrl.value = user?.avatar || ''
    nicknameValue.value = user?.nickname || ''
    phoneNumber.value = user?.mobile || ''
    originalAvatar.value = avatarUrl.value
    originalNickname.value = nicknameValue.value
  }

  const close = () => {
    visible.value = false
    emit('update:show', false)
  }

  const refreshUserData = async () => {
    const method = getUserInfo()
    method.config.cacheFor = 0
    const res = await method
    if (res) {
      userStore.setUserData({
        id: res.id!,
        nickname: res.nickname || '',
        avatar: res.avatar || '',
        mobile: res.mobile || '',
        gender: res.gender || 0,
        userLevel: res.userLevel || 0,
        weixinOpenid: res.weixinOpenid || '',
      })
    }
  }

  /** 保存头像/昵称变更（如有），然后刷新 store */
  const saveAndRefresh = async () => {
    const updates: { avatar?: string; nickname?: string } = {}
    if (avatarUrl.value && avatarUrl.value !== originalAvatar.value) {
      updates.avatar = avatarUrl.value
    }
    if (nicknameValue.value && nicknameValue.value !== originalNickname.value) {
      updates.nickname = nicknameValue.value
    }
    if (updates.avatar || updates.nickname) {
      await updateUserInfo(updates)
    }
    await refreshUserData()
  }

  const handleChooseAvatar = async (e: any) => {
    const tempUrl = e.detail.avatarUrl
    if (!tempUrl) return
    try {
      uni.showLoading({ title: '上传中...' })
      const url = await uploadWxAvatar(tempUrl)
      avatarUrl.value = url
      uni.hideLoading()
      uni.showToast({ title: '头像已选择', icon: 'success' })
    } catch (error) {
      uni.hideLoading()
      console.error('上传头像失败:', error)
      uni.showToast({ title: '上传头像失败', icon: 'none' })
    }
  }

  const handleNicknameBlur = (e: any) => {
    const name = e.detail.value?.trim()
    if (name) {
      nicknameValue.value = name
    }
  }

  const handleBindPhone = async (e: any) => {
    if (e.detail.errMsg !== 'getPhoneNumber:ok') {
      uni.showToast({ title: '需要授权手机号', icon: 'none' })
      return
    }
    try {
      uni.showLoading({ title: '绑定中' })
      // 绑定手机号
      await bindPhone({ code: e.detail.code })
      // 连同头像/昵称变更一起保存，统一刷新一次
      await saveAndRefresh()
      phoneNumber.value = userStore.userData?.mobile || ''
      uni.hideLoading()
      uni.showToast({ title: '手机号绑定成功', icon: 'success' })
      // 手机号已绑定，核心需求完成，自动关闭
      close()
    } catch (error) {
      uni.hideLoading()
      console.error('绑定手机号失败:', error)
      uni.showToast({ title: '绑定手机号失败', icon: 'none' })
    }
  }

  const handleCancel = async () => {
    // 跳过时，如果有已填写的头像/昵称变化，先保存再关闭
    const hasChanges =
      (avatarUrl.value && avatarUrl.value !== originalAvatar.value) ||
      (nicknameValue.value && nicknameValue.value !== originalNickname.value)
    if (hasChanges) {
      try {
        await saveAndRefresh()
      } catch {
        // 保存失败不阻塞关闭
      }
    }
    close()
    emit('cancel')
  }

  /** 外部调用：无手机号时弹出补充信息弹窗 */
  const checkAndShow = () => {
    if (!userStore.token) return false
    syncFromStore()
    if (!phoneNumber.value) {
      visible.value = true
      emit('update:show', true)
      return true
    }
    return false
  }

  defineExpose({ checkAndShow })
</script>
