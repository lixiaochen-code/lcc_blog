<template>
  <root-portal>
    <up-popup :show="show" mode="bottom" round="20" @close="closeDispatch">
      <view
        class="flex flex-col"
        style="max-height: 80vh; padding-bottom: env(safe-area-inset-bottom)"
      >
        <!-- 弹窗标题 -->
        <view class="flex justify-between items-center px-[30rpx] pt-[30rpx] pb-[24rpx]">
          <text class="text-[32rpx] font-600 text-[#222]">派遣员工</text>
          <up-icon name="close" size="22" color="#999" @click="closeDispatch"></up-icon>
        </view>

        <scroll-view
          scroll-y
          class="px-[30rpx] box-border"
          :show-scrollbar="true"
          enhanced
          style="max-height: calc(80vh - 220rpx - env(safe-area-inset-bottom))"
        >
          <!-- 加载中 -->
          <view v-if="staffLoading" class="flex justify-center py-[60rpx]">
            <up-loading-icon></up-loading-icon>
          </view>

          <!-- 无可用员工 -->
          <view
            v-else-if="staffList.length === 0"
            class="text-center py-[60rpx] text-[26rpx] text-[#999]"
          >
            暂无可派遣员工
          </view>

          <!-- 员工列表 -->
          <view v-else>
            <view
              class="sticky top-0 z-10 mb-[24rpx] rounded-[16rpx] bg-[#f8f8f8] p-[24rpx]"
              style="box-shadow: 0 8rpx 20rpx rgba(255, 255, 255, 0.96)"
            >
              <view
                class="flex items-center justify-between mb-[16rpx]"
                @click="showEstimateDatePicker = true"
              >
                <text class="text-[26rpx] text-[#333] font-500">预计开始时间</text>
                <view class="flex items-center gap-[8rpx]">
                  <text
                    class="text-[24rpx]"
                    :class="estimateTimeDisplay ? 'text-[#333]' : 'text-[#999]'"
                  >
                    {{ estimateTimeDisplay || '选填' }}
                  </text>
                  <up-icon name="arrow-right" size="14" color="#999"></up-icon>
                </view>
              </view>
              <view class="flex gap-[16rpx]">
                <view
                  class="flex-1 h-[68rpx] rounded-[12rpx] bg-white px-[20rpx] flex items-center justify-between"
                  @click="showEstimateDatePicker = true"
                >
                  <text class="text-[24rpx]" :class="estimateDate ? 'text-[#333]' : 'text-[#999]'">
                    {{ estimateDate || '选择日期' }}
                  </text>
                  <up-icon name="calendar" size="16" color="#999"></up-icon>
                </view>
                <view
                  class="flex-1 h-[68rpx] rounded-[12rpx] bg-white px-[20rpx] flex items-center justify-between"
                  @click="openEstimateTimePicker"
                >
                  <text class="text-[24rpx]" :class="estimateClock ? 'text-[#333]' : 'text-[#999]'">
                    {{ estimateClock || '选择时间' }}
                  </text>
                  <up-icon name="clock" size="16" color="#999"></up-icon>
                </view>
              </view>
            </view>

            <view
              v-for="staff in staffList"
              :key="staff.id"
              class="w-full box-border flex items-center gap-[20rpx] py-[20rpx] border-b border-[#f2f2f2]"
              @click="toggleStaff(staff)"
            >
              <up-checkbox-group>
                <up-checkbox
                  :checked="selectedStaffIds.includes(staff.id)"
                  active-color="#e8403a"
                  shape="circle"
                  @change="toggleStaff(staff)"
                ></up-checkbox>
              </up-checkbox-group>
              <image
                v-if="staff.avatarUrl"
                :src="staff.avatarUrl"
                class="w-[80rpx] h-[80rpx] rounded-50% flex-shrink-0 bg-[#f5f5f5]"
                mode="aspectFill"
              />
              <view
                v-else
                class="w-[80rpx] h-[80rpx] rounded-50% bg-[#e8403a] flex items-center justify-center flex-shrink-0"
              >
                <text class="text-[32rpx] text-white font-600">
                  {{ (staff.name || '?').charAt(0) }}
                </text>
              </view>
              <view class="min-w-0 flex-1 flex flex-col gap-[6rpx]">
                <text class="text-[28rpx] text-[#333] font-500 truncate">{{ staff.name || '-' }}</text>
                <text class="text-[24rpx] text-[#888] truncate">
                  {{ mapStaffRole(staff.role) }} · {{ staff.phone || '' }}
                </text>
              </view>
              <up-tag
                v-if="staff.workStatus === 2"
                class="flex-shrink-0"
                text="忙碌"
                size="mini"
                type="warning"
                plain
              ></up-tag>
            </view>
          </view>
        </scroll-view>

        <!-- 提交按钮 -->
        <view class="px-[30rpx] pt-[20rpx] pb-[30rpx] bg-white">
          <up-button
            type="error"
            shape="circle"
            color="#d63b35"
            :loading="dispatching"
            :disabled="selectedStaffIds.length === 0"
            @click="submitDispatch"
          >
            确认派遣 ({{ selectedStaffIds.length }})
          </up-button>
        </view>
      </view>
    </up-popup>

    <up-picker
      :show="showEstimateDatePicker"
      :columns="estimateDateColumns"
      @confirm="handleEstimateDateConfirm"
      @cancel="showEstimateDatePicker = false"
      @close="showEstimateDatePicker = false"
    ></up-picker>

    <up-picker
      :show="showEstimateTimePicker"
      :columns="estimateTimeColumns"
      @confirm="handleEstimateTimeConfirm"
      @cancel="showEstimateTimePicker = false"
      @close="showEstimateTimePicker = false"
    ></up-picker>
  </root-portal>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { getDispatchableStaffList, dispatchOrder } from '@/api/OrderService'
  import type { DispatchableStaffItem } from '@/api/OrderService/interfaces'
  import dayjs from 'dayjs'

  const props = defineProps<{
    show: boolean
    orderId: number
    estimateTime?: string
  }>()

  const emit = defineEmits<{
    (e: 'update:show', val: boolean): void
    (e: 'success'): void
  }>()

  // ========== 角色映射 ==========
  const STAFF_ROLE_MAP: Record<string, string> = {
    '1': '店长',
    '2': '技师',
    '3': '接待',
  }
  const mapStaffRole = (role?: string) => STAFF_ROLE_MAP[role ?? ''] ?? '员工'

  const staffLoading = ref(false)
  const dispatching = ref(false)
  const staffList = ref<DispatchableStaffItem[]>([])
  const selectedStaffIds = ref<number[]>([])
  const showEstimateDatePicker = ref(false)
  const showEstimateTimePicker = ref(false)
  const estimateDate = ref('')
  const estimateClock = ref('')

  const roundUpToFiveMinutes = (date: Date) => {
    const rounded = new Date(date)
    rounded.setSeconds(0, 0)
    const minutes = rounded.getMinutes()
    const remainder = minutes % 5
    if (remainder !== 0) {
      rounded.setMinutes(minutes + (5 - remainder))
    }
    if (rounded.getTime() < date.getTime()) {
      rounded.setMinutes(rounded.getMinutes() + 5)
    }
    return rounded
  }

  const minEstimateTimestamp = computed(() => roundUpToFiveMinutes(new Date()).getTime())
  const maxEstimateTimestamp = computed(() => {
    const max = new Date(minEstimateTimestamp.value)
    max.setDate(max.getDate() + 6)
    max.setHours(23, 55, 0, 0)
    return max.getTime()
  })

  const estimateDateColumns = computed(() => {
    const dates: string[] = []
    const start = new Date(minEstimateTimestamp.value)
    for (let i = 0; i < 7; i++) {
      const current = new Date(start)
      current.setDate(start.getDate() + i)
      dates.push(dayjs(current).format('YYYY-MM-DD'))
    }
    return [dates]
  })

  const estimateTimeColumns = computed(() => {
    const times: string[] = []
    const selected = estimateDate.value || estimateDateColumns.value[0]?.[0] || ''
    if (!selected) return [[]]

    const minDate = dayjs(minEstimateTimestamp.value)
    const isToday = selected === minDate.format('YYYY-MM-DD')
    const startMinutes = isToday ? minDate.hour() * 60 + minDate.minute() : 0

    for (let total = startMinutes; total < 24 * 60; total += 5) {
      const hour = String(Math.floor(total / 60)).padStart(2, '0')
      const minute = String(total % 60).padStart(2, '0')
      times.push(`${hour}:${minute}`)
    }

    return [times]
  })

  const estimateTimeDisplay = computed(() => {
    if (!estimateDate.value || !estimateClock.value) return ''
    return `${estimateDate.value} ${estimateClock.value}`
  })

  const estimateTimePayload = computed(() => {
    if (!estimateDate.value || !estimateClock.value) return ''
    return `${estimateDate.value} ${estimateClock.value}:00`
  })

  const normalizeEstimateTime = (value?: string): { date: string; time: string } => {
    if (!value) return { date: '', time: '' }
    const parsed = new Date(value.replace(/-/g, '/'))
    if (isNaN(parsed.getTime())) return { date: '', time: '' }
    const rounded = roundUpToFiveMinutes(parsed)
    const minDate = new Date(minEstimateTimestamp.value)
    const maxDate = new Date(maxEstimateTimestamp.value)
    const finalDate =
      rounded.getTime() < minDate.getTime()
        ? minDate
        : rounded.getTime() > maxDate.getTime()
          ? maxDate
          : rounded
    return {
      date: dayjs(finalDate).format('YYYY-MM-DD'),
      time: dayjs(finalDate).format('HH:mm'),
    }
  }

  // ========== 打开时加载列表 ==========
  watch(
    () => props.show,
    async val => {
      if (val && props.orderId) {
        selectedStaffIds.value = []
        const normalized = normalizeEstimateTime(props.estimateTime)
        estimateDate.value = normalized.date || estimateDateColumns.value[0]?.[0] || ''
        estimateClock.value = normalized.time || ''
        staffLoading.value = true
        try {
          const res = await getDispatchableStaffList({ orderId: props.orderId })
          staffList.value = res?.list ?? []
        } catch {
          uni.showToast({ title: '获取员工列表失败', icon: 'none' })
          staffList.value = []
        } finally {
          staffLoading.value = false
        }
      }
    }
  )

  const closeDispatch = () => {
    emit('update:show', false)
  }

  const handleEstimateDateConfirm = (e: { value: string[] }) => {
    const date = e.value?.[0]
    if (!date) {
      showEstimateDatePicker.value = false
      return
    }
    estimateDate.value = date
    if (!estimateTimeColumns.value[0]?.includes(estimateClock.value)) {
      estimateClock.value = estimateTimeColumns.value[0]?.[0] || ''
    }
    showEstimateDatePicker.value = false
  }

  const openEstimateTimePicker = () => {
    if (!estimateDate.value) {
      estimateDate.value = estimateDateColumns.value[0]?.[0] || ''
    }
    if (estimateTimeColumns.value[0]?.length === 0) {
      uni.showToast({ title: '当前日期暂无可选时间', icon: 'none' })
      return
    }
    showEstimateTimePicker.value = true
  }

  const handleEstimateTimeConfirm = (e: { value: string[] }) => {
    const time = e.value?.[0]
    if (time) {
      estimateClock.value = time
    }
    showEstimateTimePicker.value = false
  }

  const toggleStaff = (staff: DispatchableStaffItem) => {
    const idx = selectedStaffIds.value.indexOf(staff.id)
    if (idx >= 0) {
      selectedStaffIds.value.splice(idx, 1)
    } else {
      selectedStaffIds.value.push(staff.id)
    }
  }

  const submitDispatch = async () => {
    if (selectedStaffIds.value.length === 0) return
    dispatching.value = true

    const selectedStaff = staffList.value.filter(s => selectedStaffIds.value.includes(s.id))

    try {
      await dispatchOrder({
        orderId: props.orderId,
        estimateTime: estimateTimePayload.value || undefined,
        staffList: selectedStaff,
      })
      uni.showToast({ title: '派遣成功', icon: 'success' })
      closeDispatch()
      uni.$emit('refreshOrderList')
      emit('success')
    } finally {
      dispatching.value = false
    }
  }
</script>

<style lang="scss" scoped></style>
