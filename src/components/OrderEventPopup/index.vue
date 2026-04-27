<template>
  <root-portal>
    <up-popup :show="show" mode="bottom" round="20" :safe-area-inset-bottom="false" @close="close">
      <view class="flex flex-col bg-white rounded-t-[20rpx]" style="max-height: 80vh">
        <!-- 标题栏 -->
        <view
          class="p-[30rpx] flex justify-between items-center border-b border-solid border-[#eee]"
        >
          <text class="text-[32rpx] font-600 text-[#222]">{{ title }}</text>
          <up-icon name="close" size="22" color="#999" @click="close"></up-icon>
        </view>

        <!-- 滚动内容区 -->
        <scroll-view
          scroll-y
          class="flex-1"
          style="max-height: calc(80vh - 120rpx - 140rpx - env(safe-area-inset-bottom))"
        >
          <view class="p-[30rpx]">
            <!-- 预约时间 (仅 staffUpdateTime 显示) -->
            <view v-if="actionType === 'staffUpdateTime'" class="mb-[30rpx]">
              <view class="flex items-center justify-between mb-[16rpx]">
                <text class="text-[26rpx] text-[#666]">预约时间</text>
                <view class="flex items-center gap-[8rpx]">
                  <view
                    :class="[
                      'px-[16rpx] py-[6rpx] rounded-[8rpx] text-[22rpx]',
                      !useCustomTime ? 'bg-[#e8403a] text-white' : 'bg-[#f5f5f5] text-[#666]',
                    ]"
                    @click.stop="useCustomTime = false"
                  >
                    选择时段
                  </view>
                  <view
                    :class="[
                      'px-[16rpx] py-[6rpx] rounded-[8rpx] text-[22rpx]',
                      useCustomTime ? 'bg-[#e8403a] text-white' : 'bg-[#f5f5f5] text-[#666]',
                    ]"
                    @click.stop="useCustomTime = true"
                  >
                    自定义
                  </view>
                </view>
              </view>

              <!-- 列表选择模式 -->
              <template v-if="!useCustomTime">
                <view
                  class="flex items-center justify-between p-[20rpx] rounded-[12rpx] border border-solid border-[#dcdfe6] mb-[20rpx]"
                  @click.stop="showDatePicker = true"
                >
                  <text
                    :class="selectedDate ? 'text-[#222]' : 'text-[#c0c4cc]'"
                    class="text-[28rpx]"
                  >
                    {{ selectedDate || '请选择预约日期' }}
                  </text>
                  <up-icon name="arrow-right" size="24" color="#ccc"></up-icon>
                </view>
                <view v-if="loadingAppointmentTime" class="text-center text-[#999]">
                  可预约时间加载中...
                </view>
                <view
                  v-else-if="currentDaySchedule && currentTimeSlots.length === 0"
                  class="flex items-center justify-center text-[26rpx] text-[#e8403a] py-[60rpx]"
                >
                  当前日期无空闲预约时间，请选择其他日期
                </view>
                <template v-else-if="currentDaySchedule">
                  <scroll-view
                    v-if="hasTimelineGroup"
                    scroll-x
                    class="whitespace-nowrap mb-[20rpx]"
                    :show-scrollbar="false"
                  >
                    <view class="inline-flex gap-[12rpx]">
                      <view
                        v-for="(_, tabIndex) in currentTimelineGroup"
                        :key="tabIndex"
                        :class="[
                          'px-[24rpx] py-[12rpx] rounded-[999rpx] text-[24rpx] border border-solid',
                          selectedWorkbenchIndex === tabIndex
                            ? 'bg-[#e8403a] text-white border-[#e8403a]'
                            : 'bg-[#f8f8f8] text-[#666] border-[#ececec]',
                        ]"
                        @click.stop="handleWorkbenchChange(tabIndex)"
                      >
                        工位{{ tabIndex + 1 }}
                      </view>
                    </view>
                  </scroll-view>
                  <view class="grid grid-cols-3 gap-[16rpx]">
                    <view
                      v-for="(time, index) in currentTimeSlots"
                      :key="index"
                      :class="[
                        'h-[68rpx] rounded-[12rpx] border-2 border-solid flex items-center justify-center text-[26rpx] transition-colors duration-200',
                        !isTimeSelectable(time)
                          ? 'border-[#eaeaea] text-[#ccc] bg-[#f9f9f9] cursor-not-allowed'
                          : selectedTimeIndex === index
                            ? 'border-[#e8403a] text-[#e8403a] bg-[#fff5f5] font-bold'
                            : 'border-[#f0f0f0] text-[#666] bg-[#fafafa]',
                      ]"
                      @click.stop="isTimeSelectable(time) && (selectedTimeIndex = index)"
                    >
                      {{ formatTimeLabel(time.startTime) }}
                    </view>
                  </view>
                </template>
                <view v-else class="text-center text-[#999]">该日无可用预约时间</view>
              </template>

              <!-- 自定义时间模式 -->
              <template v-else>
                <view class="flex gap-[16rpx]">
                  <view
                    class="flex-1 flex items-center justify-between p-[20rpx] rounded-[12rpx] border border-solid border-[#dcdfe6] text-[28rpx]"
                    :class="customDate ? 'text-[#222]' : 'text-[#c0c4cc]'"
                    @click.stop="showCustomDatePicker = true"
                  >
                    <text>{{ customDate || '选择日期' }}</text>
                    <up-icon name="arrow-right" size="24" color="#ccc"></up-icon>
                  </view>
                  <view
                    class="flex-1 flex items-center justify-between p-[20rpx] rounded-[12rpx] border border-solid border-[#dcdfe6] text-[28rpx]"
                    :class="customTime ? 'text-[#222]' : 'text-[#c0c4cc]'"
                    @click.stop="showCustomTimePicker = true"
                  >
                    <text>{{ customTime || '选择时间' }}</text>
                    <up-icon name="arrow-right" size="24" color="#ccc"></up-icon>
                  </view>
                </view>
              </template>
            </view>

            <view v-if="actionType === 'staffUpdateVehicle'" class="mb-[30rpx]">
              <text class="text-[26rpx] text-[#666] mb-[16rpx] block">车辆信息</text>
              <view class="rounded-[16rpx] bg-[#f8f8f8] p-[24rpx] flex flex-col gap-[20rpx]">
                <view>
                  <text class="text-[24rpx] text-[#999] mb-[8rpx] block">车牌号</text>
                  <up-input
                    v-model="vehicleForm.licensePlate"
                    disabled
                    disabled-color="#f3f3f3"
                    border="surround"
                  ></up-input>
                </view>
                <view>
                  <text class="text-[24rpx] text-[#999] mb-[8rpx] block">车主称呼</text>
                  <up-input
                    v-model="vehicleForm.callName"
                    disabled
                    disabled-color="#f3f3f3"
                    border="surround"
                  ></up-input>
                </view>
                <view>
                  <text class="text-[24rpx] text-[#999] mb-[8rpx] block">联系电话</text>
                  <up-input
                    v-model="vehicleForm.phone"
                    disabled
                    disabled-color="#f3f3f3"
                    border="surround"
                  ></up-input>
                </view>
                <view>
                  <text class="text-[24rpx] text-[#999] mb-[8rpx] block">品牌</text>
                  <up-input
                    v-model="vehicleForm.brand"
                    maxlength="30"
                    placeholder="请输入品牌"
                    border="surround"
                  ></up-input>
                </view>
                <view>
                  <text class="text-[24rpx] text-[#999] mb-[8rpx] block">车型</text>
                  <up-input
                    v-model="vehicleForm.model"
                    maxlength="30"
                    placeholder="请输入车型"
                    border="surround"
                  ></up-input>
                </view>
                <view>
                  <text class="text-[24rpx] text-[#999] mb-[8rpx] block">颜色</text>
                  <up-input
                    v-model="vehicleForm.color"
                    maxlength="20"
                    placeholder="请输入颜色"
                    border="surround"
                  ></up-input>
                </view>
              </view>
            </view>

            <!-- 图片区域 -->
            <view v-if="showImageSection" class="mb-[30rpx]">
              <text class="text-[26rpx] text-[#666] mb-[16rpx] block">图片</text>
              <view class="flex flex-wrap gap-[16rpx]">
                <view
                  v-for="(url, idx) in uploadedUrls"
                  :key="idx"
                  class="relative w-[160rpx] h-[160rpx]"
                >
                  <image :src="url" class="w-full h-full rounded-[12rpx]" mode="aspectFill" />
                  <view
                    class="absolute -top-[10rpx] -right-[10rpx] w-[36rpx] h-[36rpx] rounded-50% bg-[#e8403a] flex items-center justify-center"
                    @click.stop="removeUrl(idx)"
                  >
                    <up-icon name="close" size="14" color="#fff"></up-icon>
                  </view>
                </view>
                <view
                  v-if="
                    actionType === 'staffUpdateVehicle'
                      ? uploadedUrls.length < 1
                      : uploadedUrls.length < 9
                  "
                  class="w-[160rpx] h-[160rpx] rounded-[12rpx] border-2rpx border-dashed border-[#ccc] flex flex-col items-center justify-center"
                  @click.stop="handleChooseImage"
                >
                  <up-icon name="camera" size="40" color="#ccc"></up-icon>
                  <text class="text-[22rpx] text-[#ccc] mt-[8rpx]">添加图片</text>
                </view>
              </view>
            </view>

            <!-- 备注 -->
            <view v-if="showRemarkSection" class="mb-[30rpx]">
              <text class="text-[26rpx] text-[#666] mb-[16rpx] block">备注</text>
              <up-textarea
                v-model="remark"
                placeholder="请输入备注信息"
                count
                maxlength="200"
                height="160"
              ></up-textarea>
            </view>
          </view>
        </scroll-view>

        <!-- 底部按钮 -->
        <view class="p-[30rpx]" style="padding-bottom: calc(30rpx + env(safe-area-inset-bottom))">
          <up-button
            type="error"
            shape="circle"
            color="#d63b35"
            :loading="submitting"
            @click.stop="handleSubmit"
          >
            提交
          </up-button>
        </view>
      </view>
    </up-popup>

    <up-picker
      :show="showDatePicker"
      :columns="datePickerColumns"
      key-name="date"
      @confirm="handleDateConfirm"
      @cancel="showDatePicker = false"
      @close="showDatePicker = false"
    ></up-picker>

    <!-- 自定义日期选择器 -->
    <up-picker
      :show="showCustomDatePicker"
      :columns="customDateColumns"
      @confirm="onCustomDateConfirm"
      @cancel="showCustomDatePicker = false"
      @close="showCustomDatePicker = false"
    ></up-picker>

    <!-- 自定义时间选择器 -->
    <up-picker
      :show="showCustomTimePicker"
      :columns="customTimeColumns"
      @confirm="onCustomTimeConfirm"
      @cancel="showCustomTimePicker = false"
      @close="showCustomTimePicker = false"
    ></up-picker>
  </root-portal>
</template>

<script setup lang="ts">
  import { ref, watch, computed } from 'vue'
  import { useUploadImage } from '@/hooks/useUploadImage'
  import {
    addOrderEvent,
    confirmPayment,
    staffUpdateTime,
    getAppointmentTimeRange,
    getOrderDetail,
  } from '@/api/OrderService'
  import type { DailySchedule, TimeScope } from '@/api/OrderService/interfaces'
  import { editVehicle } from '@/api/UserVehicleService'
  import type { CarUserVehicles } from '@/api/UserVehicleService/interfaces'

  export type EventPopupAction = 'upload' | 'payed' | 'staffUpdateTime' | 'staffUpdateVehicle'

  const props = defineProps<{
    show: boolean
    orderId: number
    actionType: EventPopupAction
    title: string
    storeServiceId?: number
  }>()

  const emit = defineEmits<{
    (e: 'update:show', val: boolean): void
    (e: 'success'): void
  }>()

  const { uploadedUrls, chooseAndUpload, removeUrl, clear } = useUploadImage({ maxCount: 9 })
  const remark = ref('')
  const submitting = ref(false)
  const selectedWorkbenchIndex = ref(0)
  const vehicleForm = ref<CarUserVehicles>({
    id: undefined,
    licensePlate: '',
    callName: '',
    phone: '',
    brand: '',
    model: '',
    color: '',
    coverUrl: '',
  })

  // ========== 时间选择 (重构后) ==========
  const _storeServiceId = ref<number>()
  const showDatePicker = ref(false)
  const selectedDate = ref('')
  const selectedTimeIndex = ref(-1)
  const appointmentSchedules = ref<DailySchedule[]>([])
  const loadingAppointmentTime = ref(false)

  // 自定义时间模式
  const useCustomTime = ref(false)
  const customDate = ref('')
  const customTime = ref('')
  const showCustomDatePicker = ref(false)
  const showCustomTimePicker = ref(false)
  const showImageSection = computed(() =>
    ['upload', 'payed', 'staffUpdateTime', 'staffUpdateVehicle'].includes(props.actionType)
  )
  const showRemarkSection = computed(() => props.actionType !== 'staffUpdateVehicle')

  // 生成未来30天日期列表
  const customDateColumns = computed(() => {
    const dates: string[] = []
    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      dates.push(`${y}-${m}-${day}`)
    }
    return [dates]
  })

  // 生成时间列表 (08:00 ~ 21:30, 每30分钟)
  const customTimeColumns = computed(() => {
    const times: string[] = []
    for (let h = 8; h <= 21; h++) {
      for (const m of ['00', '30']) {
        times.push(`${String(h).padStart(2, '0')}:${m}`)
      }
    }
    return [times]
  })

  const onCustomDateConfirm = (e: { value: string[] }) => {
    if (e.value?.[0]) customDate.value = e.value[0]
    showCustomDatePicker.value = false
  }
  const onCustomTimeConfirm = (e: { value: string[] }) => {
    if (e.value?.[0]) customTime.value = e.value[0]
    showCustomTimePicker.value = false
  }

  const datePickerColumns = computed(() => [appointmentSchedules.value.map(item => item.date)])
  const currentDaySchedule = computed(() =>
    appointmentSchedules.value.find(item => item.date === selectedDate.value)
  )
  const hasTimelineGroup = computed(() => !!currentDaySchedule.value?.timelineGroup?.length)
  const currentTimelineGroup = computed(() => currentDaySchedule.value?.timelineGroup || [])
  const currentTimeSlots = computed(() => {
    if (hasTimelineGroup.value) {
      return currentTimelineGroup.value[selectedWorkbenchIndex.value] || []
    }
    return currentDaySchedule.value?.freeTimeScope || []
  })
  const isTimeSelectable = (time: TimeScope) => time.selectEnable ?? time.valid
  const formatTimeLabel = (time: string) => time.split(' ')[1]?.slice(0, 5) || time.slice(0, 5)
  const applyScheduleSelection = (schedule?: DailySchedule) => {
    if (!schedule) {
      selectedWorkbenchIndex.value = 0
      selectedTimeIndex.value = -1
      return
    }
    if (schedule.timelineGroup?.length) {
      const workbenchIndex = schedule.timelineGroup.findIndex(group =>
        group.some(item => isTimeSelectable(item))
      )
      selectedWorkbenchIndex.value = workbenchIndex >= 0 ? workbenchIndex : 0
      const currentGroup = schedule.timelineGroup[selectedWorkbenchIndex.value] || []
      const firstValidIdx = currentGroup.findIndex(item => isTimeSelectable(item))
      selectedTimeIndex.value = firstValidIdx >= 0 ? firstValidIdx : -1
      return
    }
    const firstValidIdx = schedule.freeTimeScope.findIndex(item => isTimeSelectable(item))
    selectedTimeIndex.value = firstValidIdx >= 0 ? firstValidIdx : -1
  }
  const handleWorkbenchChange = (index: number) => {
    selectedWorkbenchIndex.value = index
    const firstValidIdx = currentTimeSlots.value.findIndex(item => isTimeSelectable(item))
    selectedTimeIndex.value = firstValidIdx >= 0 ? firstValidIdx : -1
  }
  const selectedTime = computed(() => {
    // 自定义时间模式
    if (useCustomTime.value) {
      if (customDate.value && customTime.value) {
        return `${customDate.value} ${customTime.value}:00`
      }
      return ''
    }
    // 列表选择模式
    if (selectedTimeIndex.value < 0) return ''
    const currentSlot = currentTimeSlots.value[selectedTimeIndex.value]
    if (!currentSlot) return ''
    const { startTime } = currentSlot
    return startTime
  })

  const fetchAppointmentTime = async () => {
    if (!_storeServiceId.value) return
    loadingAppointmentTime.value = true
    try {
      const res = await getAppointmentTimeRange({ storeServiceId: _storeServiceId.value })
      appointmentSchedules.value = res || []
      // 自动选中第一个有空闲可用时段的日期，若都没有则停留在最后一天
      if (res.length > 0) {
        const available = res.find((s: DailySchedule) =>
          s.timelineGroup?.length
            ? s.timelineGroup.some(group => group.some(t => isTimeSelectable(t)))
            : s.freeTimeScope.length > 0 && s.freeTimeScope.some(t => isTimeSelectable(t))
        )
        selectedDate.value = available ? available.date : res[res.length - 1].date

        const schedule = available || res.find((s: DailySchedule) => s.date === selectedDate.value)
        applyScheduleSelection(schedule)
      }
    } finally {
      loadingAppointmentTime.value = false
    }
  }

  const handleDateConfirm = (e: { value: string[] }) => {
    const value = e.value?.[0]
    if (value) {
      selectedDate.value = value
      const schedule = appointmentSchedules.value.find(s => s.date === value)
      applyScheduleSelection(schedule)
    }
    showDatePicker.value = false
  }

  // ========== 打开时重置 ==========
  watch(
    () => props.show,
    async val => {
      if (val) {
        remark.value = ''
        selectedDate.value = ''
        selectedTimeIndex.value = -1
        selectedWorkbenchIndex.value = 0
        appointmentSchedules.value = []
        useCustomTime.value = false
        customDate.value = ''
        customTime.value = ''
        showCustomDatePicker.value = false
        showCustomTimePicker.value = false
        vehicleForm.value = {
          id: undefined,
          licensePlate: '',
          callName: '',
          phone: '',
          brand: '',
          model: '',
          color: '',
          coverUrl: '',
        }
        clear()

        if (props.actionType === 'staffUpdateTime' || props.actionType === 'staffUpdateVehicle') {
          const orderDetail = await getOrderDetail({ orderId: props.orderId })
          if (props.actionType === 'staffUpdateTime') {
            _storeServiceId.value = props.storeServiceId || orderDetail.storeServicesId
            await fetchAppointmentTime()
          } else {
            const vehicles = (orderDetail.vehicles || {}) as CarUserVehicles
            vehicleForm.value = {
              ...vehicles,
              licensePlate: vehicles.licensePlate || '',
              callName: vehicles.callName || '',
              phone: vehicles.phone || '',
              brand: vehicles.brand || '',
              model: vehicles.model || '',
              color: vehicles.color || '',
              coverUrl: vehicles.coverUrl || '',
            }
            if (vehicleForm.value.coverUrl) {
              uploadedUrls.value = [vehicleForm.value.coverUrl]
            }
          }
        }
      }
    }
  )

  const close = () => {
    emit('update:show', false)
  }

  const handleChooseImage = async () => {
    try {
      await chooseAndUpload()
      if (props.actionType === 'staffUpdateVehicle' && uploadedUrls.value.length > 1) {
        uploadedUrls.value = [uploadedUrls.value[uploadedUrls.value.length - 1]]
      }
    } catch {
      /* ignore */
    }
  }

  // ========== 提交 ==========
  const SUBMIT_CONFIG: Record<
    EventPopupAction,
    {
      validate?: () => string | null
      submit: (params: {
        orderId: number
        picUrls: string
        remark: string
        time: string
      }) => Promise<any>
      successMsg: string
      failMsg: string
    }
  > = {
    upload: {
      validate: () => {
        if (uploadedUrls.value.length === 0) return '请上传服务图片'
        if (!remark.value.trim()) return '请输入备注'
        return null
      },
      submit: p => addOrderEvent({ orderId: p.orderId, picUrls: p.picUrls, remark: p.remark }),
      successMsg: '提交成功',
      failMsg: '提交失败',
    },
    payed: {
      validate: () => {
        if (uploadedUrls.value.length === 0 && !remark.value.trim()) {
          return '请上传图片或填写备注'
        }
        return null
      },
      submit: p =>
        confirmPayment({ orderId: p.orderId, extra: '', picUrls: p.picUrls, remark: p.remark }),
      successMsg: '收款确认成功',
      failMsg: '确认收款失败',
    },
    staffUpdateTime: {
      validate: () => {
        if (useCustomTime.value) {
          if (!customDate.value) return '请选择日期'
          if (!customTime.value) return '请选择时间'
          return null
        }
        if (!selectedDate.value) return '请选择预约日期'
        if (selectedTimeIndex.value < 0) return '请选择预约时间段'
        return null
      },
      submit: p =>
        staffUpdateTime({
          orderId: p.orderId,
          time: p.time,
          picUrls: p.picUrls,
          remark: p.remark,
        }),
      successMsg: '修改成功',
      failMsg: '修改失败',
    },
    staffUpdateVehicle: {
      validate: () => {
        if (!vehicleForm.value.id) return '未获取到车辆信息'
        return null
      },
      submit: () =>
        editVehicle({
          ...vehicleForm.value,
          coverUrl: uploadedUrls.value[0] || '',
          brand: vehicleForm.value.brand?.trim() || '',
          model: vehicleForm.value.model?.trim() || '',
          color: vehicleForm.value.color?.trim() || '',
        }),
      successMsg: '车辆信息修改成功',
      failMsg: '车辆信息修改失败',
    },
  }

  const handleSubmit = async () => {
    const config = SUBMIT_CONFIG[props.actionType]
    const error = config.validate?.()
    if (error) {
      uni.showToast({ title: error, icon: 'none' })
      return
    }

    submitting.value = true
    try {
      await config.submit({
        orderId: props.orderId,
        picUrls: uploadedUrls.value.join(','),
        remark: remark.value.trim(),
        time: selectedTime.value,
      })
      uni.showToast({ title: config.successMsg, icon: 'success' })
      close()
      uni.$emit('refreshOrderList')
      emit('success')
    } catch {
      uni.showToast({ title: config.failMsg, icon: 'none' })
    } finally {
      submitting.value = false
    }
  }
</script>
