<template>
  <template v-if="handleOption">
    <view @click.stop>
      <view class="flex items-end justify-between">
        <!-- 左下角: 拉黑图标 -->
        <!-- <template v-if="!isDetail">
          <view
            v-if="handleOption?.addBlockAndDelete"
            class="flex-shrink-0 flex items-center justify-center w-[48rpx] h-[48rpx] rounded-50% bg-[#f5f5f5]"
            @click.stop="emitAction('addBlockAndDelete')"
          >
            <up-icon name="minus-circle-fill" size="20" color="#999"></up-icon>
          </view>
        </template> -->

        <!-- 右侧: 操作按钮 (取消类放最右) -->
        <view class="flex flex-nowrap gap-x-[12rpx] justify-end">
          <up-button
            v-if="handleOption?.addBlockAndDelete"
            type="info"
            :size="size"
            shape="circle"
            text="拉黑"
            class="w-140rpx max-w-180rpx"
            :custom-style="customStyle"
            @click.stop="emitAction('addBlockAndDelete')"
          >
          </up-button>
          <!-- 确认收款 -->
          <up-button
            v-if="handleOption?.payed"
            type="error"
            :size="size"
            shape="circle"
            class="w-140rpx max-w-180rpx"
            :plain="!isPrimaryAction('payed')"
            :custom-style="customStyle"
            @click.stop="emitAction('payed')"
          >
            确认收款
          </up-button>

          <!-- 去核销/展示核销码 -->
          <up-button
            v-if="handleOption?.showQrCode"
            type="error"
            :size="size"
            class="w-140rpx max-w-180rpx"
            shape="circle"
            plain
            :custom-style="customStyle"
            @click.stop="emitAction('showQrCode')"
          >
            展示二维码
          </up-button>

          <!-- 确认完成 -->
          <up-button
            v-if="handleOption?.confirm"
            type="error"
            class="w-140rpx max-w-180rpx"
            :size="size"
            shape="circle"
            plain
            :custom-style="customStyle"
            @click.stop="emitAction('confirm')"
          >
            确认完成
          </up-button>

          <!-- 评价 -->
          <up-button
            v-if="handleOption?.comment"
            type="error"
            :size="size"
            shape="circle"
            plain
            class="w-140rpx max-w-180rpx"
            :custom-style="customStyle"
            @click.stop="emitAction('comment')"
          >
            评价
          </up-button>

          <!-- 再来一单 -->
          <up-button
            v-if="handleOption?.rebuy"
            type="error"
            :size="size"
            class="w-140rpx max-w-180rpx"
            shape="circle"
            plain
            :custom-style="customStyle"
            @click.stop="emitAction('rebuy')"
          >
            再来一单
          </up-button>

          <!-- 核销 -->
          <up-button
            v-if="handleOption?.check"
            text="核销"
            :size="size"
            class="w-140rpx max-w-180rpx"
            shape="circle"
            type="error"
            :plain="!isPrimaryAction('check')"
            :custom-style="customStyle"
            @click.stop="emitAction('check')"
          ></up-button>

          <!-- 派遣员工 -->
          <up-button
            v-if="handleOption?.dispatch"
            text="派遣员工"
            :size="size"
            shape="circle"
            class="w-140rpx max-w-180rpx"
            type="error"
            :plain="!isPrimaryAction('dispatch')"
            :custom-style="customStyle"
            @click.stop="emitAction('dispatch')"
          ></up-button>

          <!-- 开始服务 -->
          <up-button
            v-if="handleOption?.startService"
            text="开始服务"
            :size="size"
            shape="circle"
            type="error"
            class="w-140rpx max-w-180rpx"
            :plain="!isPrimaryAction('startService')"
            :custom-style="customStyle"
            @click.stop="emitAction('startService')"
          ></up-button>

          <!-- 上传图片 -->
          <up-button
            v-if="handleOption?.upload"
            text="上传图片"
            :size="size"
            shape="circle"
            type="error"
            class="w-140rpx max-w-180rpx"
            plain
            :custom-style="customStyle"
            @click.stop="emitAction('upload')"
          ></up-button>

          <!-- 结束服务 -->
          <up-button
            v-if="handleOption?.endService"
            text="结束服务"
            :size="size"
            shape="circle"
            type="error"
            class="w-140rpx max-w-180rpx"
            :plain="!isPrimaryAction('endService')"
            :custom-style="customStyle"
            @click.stop="emitAction('endService')"
          ></up-button>

          <!-- 店长修改预约时间 -->
          <up-button
            v-if="handleOption?.staffUpdateTime"
            text="修改时间"
            :size="size"
            shape="circle"
            type="error"
            class="w-140rpx max-w-180rpx"
            :plain="!isPrimaryAction('staffUpdateTime')"
            :custom-style="customStyle"
            @click.stop="emitAction('staffUpdateTime')"
          ></up-button>

          <up-button
            v-if="handleOption?.staffUpdateVehicle && !isDetail"
            text="修改车辆"
            :size="size"
            shape="circle"
            type="error"
            class="w-140rpx max-w-180rpx"
            :plain="!isPrimaryAction('staffUpdateVehicle')"
            :custom-style="customStyle"
            @click.stop="emitAction('staffUpdateVehicle')"
          ></up-button>

          <!-- 删除订单 -->
          <up-button
            v-if="handleOption?.delete"
            type="error"
            :size="size"
            shape="circle"
            plain
            :custom-style="customStyle"
            class="w-140rpx max-w-180rpx"
            @click.stop="emitAction('delete')"
          >
            删除订单
          </up-button>

          <!-- 取消订单 (客户端) — 放最右 -->
          <up-button
            v-if="handleOption?.cancel"
            type="error"
            :size="size"
            shape="circle"
            plain
            class="w-140rpx max-w-180rpx"
            :custom-style="customStyle"
            @click.stop="emitAction('cancel')"
          >
            取消订单
          </up-button>

          <!-- 店长取消订单 — 放最右 -->
          <up-button
            v-if="handleOption?.staffCancel"
            text="取消订单"
            :size="size"
            shape="circle"
            type="error"
            class="w-140rpx max-w-180rpx"
            plain
            :custom-style="customStyle"
            @click.stop="emitAction('staffCancel')"
          ></up-button>
        </view>
      </view>

      <!-- 内置: 派遣员工弹窗 -->
      <OrderDispatchPopup
        v-model:show="showDispatch"
        :order-id="dispatchOrderId"
        :estimate-time="props.order.appointmentTime"
        @success="handleDispatchSuccess"
      />

      <!-- 内置: 事件弹窗 (上传图片 / 确认收款 / 修改预约时间) -->
      <OrderEventPopup
        v-model:show="showEventPopup"
        :order-id="props.order.id"
        :action-type="eventPopupAction"
        :title="eventPopupTitle"
        @success="handleEventSuccess"
      />

      <!-- 内置: 取消订单弹窗 -->
      <OrderCancelPopup
        ref="cancelPopupRef"
        v-model:show="showCancelPopup"
        @confirm="handleCancelConfirm"
      />
    </view>
  </template>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import type { OrderHandleOption, OrderListItem } from '@/api/OrderService/interfaces'
  import { useOrderActions } from '@/hooks/useOrderActions'
  import { cancelOrder, staffCancelOrder, addBlockAndDeleteOrder } from '@/api/OrderService'
  import OrderDispatchPopup from '@/components/OrderDispatchPopup/index.vue'
  import OrderEventPopup from '@/components/OrderEventPopup/index.vue'
  import OrderCancelPopup from '@/components/OrderCancelPopup/index.vue'
  import type { EventPopupAction } from '@/components/OrderEventPopup/index.vue'

  const props = withDefaults(
    defineProps<{
      order: OrderListItem | any
      handleOption?: OrderHandleOption
      role?: 'client' | 'staff' | 'manager'
      isDetail?: boolean
    }>(),
    {
      handleOption: () => ({}) as OrderHandleOption,
      role: 'client',
      isDetail: false,
    }
  )

  const emit = defineEmits<{
    (e: 'action', type: string, order: any): void
    (e: 'refresh', orderId: number): void
  }>()

  // 通过 isDetail 动态控制按钮大小和样式
  const size = computed(() => (props.isDetail ? 'normal' : 'mini'))
  const customStyle = computed(() => {
    if (props.isDetail) {
      return {}
    }
    return { width: '140rpx', height: '48rpx', margin: '0', padding: '0 16rpx', fontSize: '22rpx' }
  })

  // 判断是否主要操作（非 plain）
  const isPrimaryAction = (action: string) => {
    const primaryActions = [
      'check',
      'dispatch',
      'payed',
      'startService',
      'endService',
      'staffUpdateTime',
      'staffUpdateVehicle',
    ]
    return primaryActions.includes(action)
  }

  // ============== 订单基本操作 (useOrderActions) ==============
  const {
    handleCheck,
    handleStartService,
    handleEndService,
    handleDeleteOrder,
    handleConfirmOrder,
  } = useOrderActions(orderId => {
    if (orderId) {
      emit('refresh', orderId)
    }
  })

  // ============== 派遣员工逻辑 ==============
  const showDispatch = ref(false)
  const dispatchOrderId = ref(0)
  const handleDispatchSuccess = () => {
    emit('refresh', props.order.id)
  }

  // ============== 事件弹窗逻辑 (上传/收款/修改时间) ==============
  const showEventPopup = ref(false)
  const eventPopupAction = ref<EventPopupAction>('upload')
  const eventPopupTitle = ref('')

  const EVENT_POPUP_TITLES: Record<EventPopupAction, string> = {
    upload: '上传服务图片',
    payed: '确认收款',
    staffUpdateTime: '修改预约时间',
    staffUpdateVehicle: '修改车辆信息',
  }

  const openEventPopup = (action: EventPopupAction) => {
    eventPopupAction.value = action
    eventPopupTitle.value = EVENT_POPUP_TITLES[action]
    showEventPopup.value = true
  }

  const handleEventSuccess = () => {
    emit('refresh', props.order.id)
  }

  // ============== 取消订单弹窗 (用户取消 + 店长取消) ==============
  const showCancelPopup = ref(false)
  const cancelPopupRef = ref<InstanceType<typeof OrderCancelPopup>>()
  const cancelType = ref<'cancel' | 'staffCancel'>('cancel')

  const openCancelPopup = (type: 'cancel' | 'staffCancel') => {
    cancelType.value = type
    showCancelPopup.value = true
  }

  const handleCancelConfirm = async (reason: string) => {
    try {
      const orderId = props.order.id
      if (cancelType.value === 'staffCancel') {
        await staffCancelOrder({ orderId, remark: reason })
      } else {
        await cancelOrder({ orderId, remark: reason })
      }
      showCancelPopup.value = false
      uni.showToast({ title: '已取消', icon: 'success' })
      uni.$emit('refreshOrderList')
      emit('refresh', orderId)
    } catch {
      cancelPopupRef.value?.stopLoading()
      uni.showToast({ title: '取消失败', icon: 'none' })
    }
  }

  // ============== 拉黑并删除 ==============
  const handleBlockAndDelete = (orderItem: any) => {
    uni.showModal({
      title: '拉黑用户',
      content: '确定要拉黑该用户并删除订单吗？此操作不可撤销。',
      success: async res => {
        if (!res.confirm) return
        uni.showLoading({ title: '处理中...' })
        try {
          await addBlockAndDeleteOrder({ orderId: orderItem.id, remark: '' })
          uni.hideLoading()
          uni.showToast({ title: '已拉黑', icon: 'success' })
          uni.$emit('refreshOrderList')
          emit('refresh', orderItem.id)
        } catch {
          uni.hideLoading()
          uni.showToast({ title: '操作失败', icon: 'none' })
        }
      },
    })
  }

  // ============== 事件分发总控 ==============
  const emitAction = (actionType: string) => {
    switch (actionType) {
      case 'check':
        handleCheck(props.order)
        break
      case 'payed':
        openEventPopup('payed')
        break
      case 'cancel':
        openCancelPopup('cancel')
        break
      case 'delete':
        handleDeleteOrder(props.order, props.isDetail)
        break
      case 'confirm':
        handleConfirmOrder(props.order)
        break
      case 'startService':
        handleStartService(props.order)
        break
      case 'endService':
        handleEndService(props.order)
        break
      case 'showQrCode':
        uni.navigateTo({
          url: `/pages_client/pages/order/qrcode/index?qrCode=${encodeURIComponent(props.order.qrCodeUrl || '')}`,
        })
        break
      case 'comment':
        uni.navigateTo({ url: `/pages_client/pages/order/comment/index?orderId=${props.order.id}` })
        break
      case 'rebuy': {
        const query = [
          `serviceCode=${encodeURIComponent(props.order.serviceCode || '')}`,
          `storeId=${props.order.storeId || ''}`,
          `storeServiceId=${props.order.storeServicesId || ''}`,
        ].join('&')
        uni.navigateTo({
          url: `/pages_client/pages/service/booking/index?${query}`,
        })
        break
      }
      case 'upload':
        openEventPopup('upload')
        break
      case 'dispatch':
        dispatchOrderId.value = props.order.id
        showDispatch.value = true
        break
      case 'staffCancel':
        openCancelPopup('staffCancel')
        break
      case 'addBlockAndDelete':
        handleBlockAndDelete(props.order)
        break
      case 'staffUpdateTime':
        openEventPopup('staffUpdateTime')
        break
      case 'staffUpdateVehicle':
        openEventPopup('staffUpdateVehicle')
        break
      default:
        emit('action', actionType, props.order)
        break
    }
  }
</script>

<style lang="scss" scoped></style>
