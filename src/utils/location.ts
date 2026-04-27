/**
 * 自动判断环境并获取位置信息
 * @returns {Promise}
 */
export const getAutoLocation = (): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    // 微信小程序逻辑：增加权限校验
    uni.getSetting({
      success: res => {
        if (res.authSetting['scope.userLocation'] === false) {
          // 用户之前拒绝过授权，引导去设置页
          showAuthModal()
          reject('AUTH_DENIED')
        } else {
          executeGetLocation(resolve, reject)
        }
      },
    })
    // #endif

    // #ifdef H5
    // H5 逻辑：检查是否是 HTTPS
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
      console.warn('H5环境建议在HTTPS下使用定位，否则可能失败')
    }
    executeGetLocation(resolve, reject)
    // #endif

    // #ifdef APP-PLUS
    // App 端逻辑
    executeGetLocation(resolve, reject)
    // #endif
  })
}

/**
 * 执行底层的定位调用
 */
function executeGetLocation(resolve, reject) {
  uni.getLocation({
    type: 'wgs84',
    isHighAccuracy: true,
    success: res => {
      console.log('getLocation success', res)
      resolve({
        lat: res.latitude,
        lng: res.longitude,
        accuracy: res.accuracy,
        platform: uni.getSystemInfoSync().uniPlatform,
      })
    },
    fail: err => {
      uni.showToast({
        title: '获取位置失败',
        icon: 'none',
      })
      reject(err)
    },
  })
}

/**
 * 微信小程序权限引导弹窗
 */
function showAuthModal() {
  uni.showModal({
    title: '提示',
    content: '需要位置权限才能为您提供服务',
    confirmText: '去授权',
    success: res => {
      if (res.confirm) {
        uni.openSetting()
      }
    },
  })
}
