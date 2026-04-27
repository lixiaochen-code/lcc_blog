import { ref } from 'vue'
import { uploadImageBase64 } from '@/api/StorageService'
import type { UploadImageResponse } from '@/api/StorageService/interfaces'

export interface UseUploadImageOptions {
  maxCount?: number
  sizeType?: ('original' | 'compressed')[]
  maxSize?: number
}

const fileToBase64 = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    const fs = uni.getFileSystemManager()
    fs.readFile({
      filePath,
      encoding: 'base64',
      success: res => resolve(res.data as string),
      fail: reject,
    })
    // #endif

    // #ifdef H5
    uni.request({
      url: filePath,
      responseType: 'arraybuffer',
      success: res => {
        const arrayBuffer = res.data as ArrayBuffer
        const bytes = new Uint8Array(arrayBuffer)
        let binary = ''
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i])
        }
        resolve(btoa(binary))
      },
      fail: reject,
    })
    // #endif
  })
}

const getSuffix = (filePath: string): string => {
  const match = filePath.match(/\.(\w+)$/)
  return match ? match[1].toLowerCase() : 'png'
}

const getFileName = (filePath: string, suffix: string): string => {
  const parts = filePath.split('/')
  const fullName = parts[parts.length - 1] || ''
  const baseName = fullName.replace(/\.\w+$/, '') || `image_${Date.now()}`
  return `${baseName}.${suffix}`
}

/**
 * 上传微信临时头像到服务器
 * 用于 open-type="chooseAvatar" 返回的临时文件路径
 * @param tempFilePath 微信返回的临时文件路径
 * @returns 服务器上的永久 URL
 */
export const uploadWxAvatar = async (tempFilePath: string): Promise<string> => {
  const base64 = await fileToBase64(tempFilePath)
  const suffix = getSuffix(tempFilePath)
  const fileName = getFileName(tempFilePath, suffix)
  const res = await uploadImageBase64({ base64, suffix, fileName })
  return typeof res === 'string' ? (res as string) : (res?.url ?? '')
}

/**
 * 选择并上传图片（支持微信小程序拍照/相册，H5 选择文件）
 * 返回上传后的远程 URL 列表
 */
export const useUploadImage = (options: UseUploadImageOptions = {}) => {
  const {
    maxCount = 1,
    sizeType = ['compressed', 'original'],
    maxSize = 10 * 1024 * 1024,
  } = options

  const uploading = ref(false)
  const uploadedUrls = ref<string[]>([])

  const chooseAndUpload = (): Promise<UploadImageResponse[]> => {
    return new Promise((resolve, reject) => {
      // #ifdef MP-WEIXIN
      // @ts-ignore
      const sourceType: ('album' | 'camera')[] = ['album', 'camera']
      // #endif
      // #ifndef MP-WEIXIN
      // @ts-ignore
      // eslint-disable-next-line no-redeclare
      const sourceType: ('album' | 'camera')[] = ['album']
      // #endif

      uni.chooseImage({
        count: maxCount,
        sizeType,
        sourceType,
        success: async chooseRes => {
          const files = (chooseRes.tempFiles || []) as UniApp.ChooseImageSuccessCallbackResultFile[]
          const oversized = files.filter(f => f.size > maxSize)
          if (oversized.length > 0) {
            const limitMB = (maxSize / 1024 / 1024).toFixed(0)
            uni.showToast({ title: `图片不能超过${limitMB}MB`, icon: 'none' })
            reject(new Error('图片超出大小限制'))
            return
          }

          uploading.value = true
          uni.showLoading({ title: '上传中...' })

          try {
            const results: UploadImageResponse[] = []

            for (const file of chooseRes.tempFilePaths) {
              const base64 = await fileToBase64(file)
              const suffix = getSuffix(file)
              const fileName = getFileName(file, suffix)

              const res = await uploadImageBase64({ base64, suffix, fileName })
              const url = typeof res === 'string' ? (res as string) : (res?.url ?? '')
              results.push({ url, key: (res as UploadImageResponse)?.key })
              if (url) uploadedUrls.value.push(url)
            }

            uni.hideLoading()
            resolve(results)
          } catch (e) {
            uni.hideLoading()
            uni.showToast({ title: '上传失败', icon: 'none' })
            reject(e)
          } finally {
            uploading.value = false
          }
        },
        fail: err => {
          reject(err)
        },
      })
    })
  }

  const removeUrl = (index: number) => {
    uploadedUrls.value.splice(index, 1)
  }

  const clear = () => {
    uploadedUrls.value = []
  }

  return {
    uploading,
    uploadedUrls,
    chooseAndUpload,
    removeUrl,
    clear,
  }
}
