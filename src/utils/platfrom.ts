/** 获取当前平台 */
export const getCurrentPlatform = () => {
  return process.env.UNI_PLATFORM
}

/** 是否是H5平台 */
export const isH5Platform = () => {
  return getCurrentPlatform() === 'h5'
}

/** 是否是小程序平台 */
export const isMiniProgramPlatform = () => {
  return getCurrentPlatform() === 'mp-weixin'
}
