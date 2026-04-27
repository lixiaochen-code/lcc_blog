<template>
  <DefaultLayout>
    <view class="min-h-100vh bg-[#f6f6f6] px-24rpx py-20rpx">
      <view class="bg-white rounded-16rpx px-30rpx">
        <up-form ref="uForm" :model="form" label-width="160rpx">
          <up-form-item label="车牌号" prop="licensePlate" required border-bottom>
            <up-input
              v-model="form.licensePlate"
              placeholder="请输入车牌号"
              border="none"
            ></up-input>
          </up-form-item>
          <up-form-item label="车主称呼" prop="callName" required border-bottom>
            <up-input
              v-model="form.callName"
              placeholder="请输入车主称呼，如张先生"
              border="none"
            ></up-input>
          </up-form-item>
          <up-form-item label="联系电话" prop="phone" required border-bottom>
            <view class="flex items-center gap-16rpx w-full">
              <up-input
                v-model="form.phone"
                type="number"
                maxlength="11"
                placeholder="请输入11位手机号"
                border="none"
              ></up-input>
              <view
                v-if="currentMobile"
                class="text-[#d63b35] text-24rpx"
                @click="fillCurrentMobile"
                >快捷输入</view
              >
            </view>
          </up-form-item>
          <up-form-item label="车辆图片" prop="coverUrl" border-bottom>
            <view class="flex items-center gap-16rpx py-10rpx">
              <view
                v-if="form.coverUrl"
                class="relative h-120rpx w-120rpx overflow-hidden rounded-12rpx border-2rpx border-[#eee]"
              >
                <image :src="form.coverUrl" class="h-full w-full" mode="aspectFill" />
                <view
                  class="absolute right-0 top-0 flex h-36rpx w-36rpx items-center justify-center rounded-bl-12rpx bg-[rgba(0,0,0,0.5)]"
                  @click="removeCover"
                >
                  <up-icon name="close" size="12" color="#fff"></up-icon>
                </view>
              </view>
              <view
                v-else
                class="flex h-120rpx w-120rpx flex-col items-center justify-center rounded-12rpx border-2rpx border-dashed border-[#ccc] bg-[#f9f9f9]"
                @click="handleUploadCover"
              >
                <up-icon name="camera" size="24" color="#ccc"></up-icon>
                <text class="mt-8rpx text-20rpx text-[#999]">上传图片</text>
              </view>
            </view>
          </up-form-item>
          <up-form-item label="默认车辆" prop="isDefault">
            <up-switch v-model="form.isDefault"></up-switch>
          </up-form-item>
        </up-form>
      </view>

      <view class="mt-60rpx">
        <up-button
          type="error"
          shape="circle"
          text="保存"
          color="#d63b35"
          :loading="loading"
          @click="submit"
        ></up-button>
      </view>
    </view>
  </DefaultLayout>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import { getDetail, saveVehicle } from '@/api/UserVehicleService'
  import type { CarUserVehicles } from '@/api/UserVehicleService/interfaces'
  import DefaultLayout from '@/components/DefaultLayout/index.vue'
  import { useUploadImage } from '@/hooks/useUploadImage'
  import { useUserStore } from '@/store/user'

  const { chooseAndUpload } = useUploadImage({ maxCount: 1 })
  const userStore = useUserStore()
  const phoneRegExp = /^1[3-9]\d{9}$/

  const loading = ref(false)
  const form = ref<CarUserVehicles>({
    licensePlate: '',
    callName: '',
    phone: '',
    coverUrl: '',
    isDefault: false,
    deleted: false,
    addTime: '',
    updateTime: '',
  })

  const currentMobile = computed(() => userStore.userData?.mobile?.trim() || '')

  const fillCurrentMobile = () => {
    if (!currentMobile.value) return
    form.value.phone = currentMobile.value
  }

  const handleUploadCover = async () => {
    try {
      const results = await chooseAndUpload()
      if (results && results.length > 0) {
        form.value.coverUrl = results[0].url
      }
    } catch {
      /* ignore */
    }
  }

  const removeCover = () => {
    form.value.coverUrl = ''
  }

  const id = ref<number | null>(null)

  onLoad(async options => {
    if (options && options.id) {
      id.value = Number(options.id)
      uni.setNavigationBarTitle({ title: '编辑车辆' })
      try {
        const res = await getDetail(Number(options.id))
        if (res) {
          form.value = res
        }
      } catch (e) {
        console.error('获取车辆详情失败', e)
        uni.showToast({ title: '获取详情失败', icon: 'none' })
      }
    } else {
      uni.setNavigationBarTitle({ title: '添加车辆' })
    }
  })

  const submit = async () => {
    const licensePlate = form.value.licensePlate?.trim() || ''
    const callName = form.value.callName?.trim() || ''
    const phone = form.value.phone?.trim() || ''

    if (!licensePlate) {
      uni.showToast({ title: '请输入车牌号', icon: 'none' })
      return
    }
    if (!callName) {
      uni.showToast({ title: '请输入车主称呼', icon: 'none' })
      return
    }
    if (!phone) {
      uni.showToast({ title: '请输入联系电话', icon: 'none' })
      return
    }
    if (!phoneRegExp.test(phone)) {
      uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
      return
    }

    loading.value = true
    try {
      const now = new Date().toISOString().replace('T', ' ').slice(0, 19)
      if (!form.value.addTime) {
        form.value.addTime = now
      }
      if (![null, undefined].includes(id.value)) {
        form.value.id = id.value
      }
      form.value.licensePlate = licensePlate
      form.value.callName = callName
      form.value.phone = phone
      form.value.updateTime = now
      await saveVehicle(form.value)
      uni.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    } catch (e) {
      console.error('保存失败', e)
      uni.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      loading.value = false
    }
  }
</script>
