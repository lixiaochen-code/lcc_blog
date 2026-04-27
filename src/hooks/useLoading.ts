import { watchEffect, type Ref } from 'vue'

export const useLoading = (loading: Ref<boolean>) => {
  watchEffect(() => {
    if (loading.value) {
      uni.showLoading()
    } else {
      uni.hideLoading()
    }
  })
}
