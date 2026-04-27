import { alovaInst } from '@/utils/request'
import type * as Types from './interfaces'

/**
 * download
 * @param key key
 */
export const download = (key: string) =>
  alovaInst.Get<Types.ResourceResponse>(`/wx/storage/download/${key}`)

/**
 * fetch
 * @param key key
 */
export const fetch = (key: string) =>
  alovaInst.Get<Types.ResourceResponse>(`/wx/storage/fetch/${key}`)

/**
 * upload
 * @param data FormData containing file
 */
export const upload = (data: FormData) =>
  alovaInst.Post<any>('/wx/storage/upload', data, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

/**
 * uploadImageBase64
 * @param data base64Vo
 */
export const uploadImageBase64 = (data: Types.UploadImageBase64Params) =>
  alovaInst.Post<Types.UploadImageResponse>('/wx/storage/upload_image_base64', data)
