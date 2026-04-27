import { ref } from 'vue'
import {
  checkQrCode,
  startService,
  endService,
  deleteOrder,
  confirmOrder,
} from '@/api/OrderService'
import type { OrderListItem } from '@/api/OrderService/interfaces'

export function useOrderActions(onSuccess?: (orderId?: number) => void) {
  const loading = ref(false)

  const emitSuccess = (orderId?: number) => {
    uni.$emit('refreshOrderList')
    onSuccess?.(orderId)
  }

  // ========== 核销订单 (员工/店长) ==========
  const handleCheck = (orderItem: OrderListItem) => {
    uni.showLoading({ title: '核销中...' })

    checkQrCode({ orderId: orderItem.id })
      .then(() => {
        uni.showToast({ title: '核销成功', icon: 'success' })
        emitSuccess(orderItem.id)
      })
      .catch(() => {
        uni.hideLoading()
        uni.showToast({ title: '核销失败', icon: 'none' })
      })
  }

  // ========== 开始服务 (员工/店长) ==========
  const handleStartService = (orderItem: OrderListItem) => {
    uni.showModal({
      title: '开始服务',
      content: '确认开始为该订单提供服务？',
      success: async res => {
        if (!res.confirm) return
        uni.showLoading({ title: '处理中...' })
        try {
          await startService({ orderId: orderItem.id })
          uni.hideLoading()
          uni.showToast({ title: '已开始服务', icon: 'success' })
          emitSuccess(orderItem.id)
        } catch {
          uni.hideLoading()
          uni.showToast({ title: '开始服务失败', icon: 'none' })
        }
      },
    })
  }

  // ========== 结束服务 (员工/店长) ==========
  const handleEndService = (orderItem: OrderListItem) => {
    uni.showModal({
      title: '结束服务',
      content: '确认该订单服务已完成？',
      success: async res => {
        if (!res.confirm) return
        uni.showLoading({ title: '处理中...' })
        try {
          await endService({ orderId: orderItem.id })
          uni.hideLoading()
          uni.showToast({ title: '服务已结束', icon: 'success' })
          emitSuccess(orderItem.id)
        } catch {
          uni.hideLoading()
          uni.showToast({ title: '结束服务失败', icon: 'none' })
        }
      },
    })
  }

  // ========== 删除订单 (用户) ==========
  const handleDeleteOrder = (orderItem: OrderListItem, goBack = false) => {
    uni.showModal({
      title: '提示',
      content: '确定要删除该订单吗？删除后无法恢复。',
      success: async res => {
        if (!res.confirm) return
        try {
          await deleteOrder({ orderId: orderItem.id })
          uni.showToast({ title: '已删除', icon: 'success' })
          if (!goBack) {
            emitSuccess(orderItem.id)
          }
          if (goBack) {
            setTimeout(() => uni.navigateBack(), 1000)
          }
        } catch (e) {
          console.error('删除订单失败', e)
          uni.showToast({ title: '删除失败', icon: 'none' })
        }
      },
    })
  }

  // ========== 确认完成 (用户) ==========
  const handleConfirmOrder = (orderItem: OrderListItem) => {
    uni.showModal({
      title: '提示',
      content: '确认服务已完成？',
      success: async res => {
        if (!res.confirm) return
        try {
          await confirmOrder({ orderId: orderItem.id })
          uni.showToast({ title: '已确认', icon: 'success' })
          emitSuccess(orderItem.id)
        } catch (e) {
          console.error('确认完成失败', e)
          uni.showToast({ title: '操作失败', icon: 'none' })
        }
      },
    })
  }

  return {
    loading,
    handleCheck,
    handleStartService,
    handleEndService,
    handleDeleteOrder,
    handleConfirmOrder,
  }
}
