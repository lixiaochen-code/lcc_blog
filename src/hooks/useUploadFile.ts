import { ref } from 'vue'
import { upload } from '@/api/StorageService'

export interface UseUploadFileOptions {
  /** 最大文件数量 */
  maxCount?: number
  /** 最大文件大小 (字节)，默认 10MB */
  maxSize?: number
  /** 允许的文件类型，默认 ['image'] */
  accept?: ('image' | 'video' | 'all')[]
  /** 图片压缩类型 */
  sizeType?: ('original' | 'compressed')[]
  /** 图片来源 */
  sourceType?: ('album' | 'camera')[]
}

export interface UploadFileResult {
  /** 上传后的 URL */
  url: string
  /** 存储 key */
  key?: string
  /** 原始文件名 */
  fileName?: string
}

/**
 * 基于 FormData 的文件上传 hook
 * 支持微信小程序和 H5 平台
 */
export const useUploadFile = (options: UseUploadFileOptions = {}) => {
  const {
    maxCount = 1,
    maxSize = 10 * 1024 * 1024,
    sizeType = ['compressed', 'original'],
    sourceType = ['album', 'camera'],
  } = options

  const uploading = ref(false)
  const uploadedFiles = ref<UploadFileResult[]>([])
  const progress = ref(0)

  /**
   * 上传单个文件 (通过临时文件路径)
   */
  const uploadFile = async (filePath: string, fileName?: string): Promise<UploadFileResult> => {
    return new Promise((resolve, reject) => {
      // #ifdef MP-WEIXIN
      uni.uploadFile({
        url: import.meta.env.VITE_SERVER_BASEURL + '/wx/storage/upload',
        filePath,
        name: 'file',
        formData: {
          fileName: fileName || `file_${Date.now()}`,
        },
        success: res => {
          try {
            const data = JSON.parse(res.data)
            if (data.errno === 0 && data.data) {
              const result: UploadFileResult = {
                url: data.data.url || data.data,
                key: data.data.key,
                fileName: fileName,
              }
              resolve(result)
            } else {
              reject(new Error(data.errmsg || '上传失败'))
            }
          } catch {
            reject(new Error('解析响应失败'))
          }
        },
        fail: err => reject(err),
      })
      // #endif

      // #ifdef H5
      const xhr = new XMLHttpRequest()
      xhr.open('POST', import.meta.env.VITE_SERVER_BASEURL + '/wx/storage/upload')

      xhr.upload.onprogress = e => {
        if (e.lengthComputable) {
          progress.value = Math.round((e.loaded / e.total) * 100)
        }
      }

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText)
          if (data.errno === 0 && data.data) {
            const result: UploadFileResult = {
              url: data.data.url || data.data,
              key: data.data.key,
              fileName: fileName,
            }
            resolve(result)
          } else {
            reject(new Error(data.errmsg || '上传失败'))
          }
        } catch {
          reject(new Error('解析响应失败'))
        }
      }

      xhr.onerror = () => reject(new Error('网络错误'))

      fetch(filePath)
        .then(res => res.blob())
        .then(blob => {
          const formData = new FormData()
          formData.append('file', blob, fileName || `file_${Date.now()}`)
          xhr.send(formData)
        })
        .catch(reject)
      // #endif
    })
  }

  /**
   * 直接上传 File 对象 (仅 H5)
   */
  const uploadFileObject = async (file: File): Promise<UploadFileResult> => {
    uploading.value = true
    progress.value = 0

    try {
      const formData = new FormData()
      formData.append('file', file, file.name)

      const res = await upload(formData)
      const result: UploadFileResult = {
        url: res?.url || res?.data?.url || res,
        key: res?.key || res?.data?.key,
        fileName: file.name,
      }

      uploadedFiles.value.push(result)
      return result
    } finally {
      uploading.value = false
      progress.value = 100
    }
  }

  /**
   * 选择图片并上传
   */
  const chooseAndUploadImage = (): Promise<UploadFileResult[]> => {
    return new Promise((resolve, reject) => {
      uni.chooseImage({
        count: maxCount,
        sizeType,
        sourceType,
        success: async chooseRes => {
          const files = chooseRes.tempFiles || []
          const oversized = files.filter(
            (f: UniApp.ChooseImageSuccessCallbackResultFile) => f.size > maxSize
          )

          if (oversized.length > 0) {
            const limitMB = (maxSize / 1024 / 1024).toFixed(0)
            uni.showToast({ title: `文件不能超过${limitMB}MB`, icon: 'none' })
            reject(new Error('文件超出大小限制'))
            return
          }

          uploading.value = true
          uni.showLoading({ title: '上传中...' })

          try {
            const results: UploadFileResult[] = []

            for (let i = 0; i < chooseRes.tempFilePaths.length; i++) {
              const filePath = chooseRes.tempFilePaths[i]
              const file = files[i] as UniApp.ChooseImageSuccessCallbackResultFile
              const fileName = (file as any).name || `image_${Date.now()}.jpg`

              progress.value = Math.round((i / chooseRes.tempFilePaths.length) * 100)
              const result = await uploadFile(filePath, fileName)
              results.push(result)
              uploadedFiles.value.push(result)
            }

            uni.hideLoading()
            resolve(results)
          } catch (e) {
            uni.hideLoading()
            uni.showToast({ title: '上传失败', icon: 'none' })
            reject(e)
          } finally {
            uploading.value = false
            progress.value = 100
          }
        },
        fail: err => reject(err),
      })
    })
  }

  /**
   * 移除已上传的文件
   */
  const removeFile = (index: number) => {
    uploadedFiles.value.splice(index, 1)
  }

  /**
   * 清空所有已上传文件
   */
  const clear = () => {
    uploadedFiles.value = []
    progress.value = 0
  }

  return {
    /** 是否正在上传 */
    uploading,
    /** 已上传的文件列表 */
    uploadedFiles,
    /** 上传进度 (0-100) */
    progress,
    /** 上传单个文件 (通过临时路径) */
    uploadFile,
    /** 上传 File 对象 (仅 H5) */
    uploadFileObject,
    /** 选择图片并上传 */
    chooseAndUploadImage,
    /** 移除已上传的文件 */
    removeFile,
    /** 清空所有文件 */
    clear,
  }
}
