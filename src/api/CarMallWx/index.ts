import { alovaInst } from '@/utils/request'
import type * as Types from './interfaces'

/**
 * 获取车辆服务小程序基础信息
 * @returns alova 实例
 */
export const getCarMallWxInfo = () =>
  alovaInst.Get<Types.BaseResponse<Types.CarMallWxInfo>>('/v2/api-docs', {
    params: {
      group: 'wx',
    },
  })
