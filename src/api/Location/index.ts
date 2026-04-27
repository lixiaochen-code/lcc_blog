import AdapterUniapp from '@alova/adapter-uniapp'
import { createAlova } from 'alova'

const alova = createAlova({
  baseURL: import.meta.env.VITE_APP_LOCATION_URL,
  ...AdapterUniapp(),
  responded: {
    onSuccess: async response => {
      if ('data' in response) {
        if (typeof response.data === 'object' && response.data !== null) {
          const res = response.data
          return (res as any).result
        }
        return response.data
      }
      return response
    },
    onError: err => {
      return Promise.reject(err)
    },
  },
})
enum Api {
  /** 查询地址 */
  GET_LOCATION = `/ws/geocoder/v1/`,
}
/**
 * 
key	是	开发密钥（Key）	key=OB4BZ-D4W3U-B7VVO-4PJWW-6TKDJ-*****
location	是	经纬度（GCJ02坐标系），格式：
location=lat<纬度>,lng<经度>	location= 39.984154,116.307490
 * @returns 
 */
export const getLocation = (latitude: number, longitude: number) =>
  alova.Get<any>(Api.GET_LOCATION, {
    params: {
      key: import.meta.env.VITE_APP_LOCATION_KEY,
      location: `${latitude},${longitude}`,
    },
  })
