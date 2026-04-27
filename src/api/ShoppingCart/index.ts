import { alovaInst } from '@/utils/request'
import type * as Types from './interfaces'

/**
 * 添加购物车
 * @param data 购物车对象
 */
export const addCart = (data: Types.AddCartRequest) => alovaInst.Post<any>('/wx/cart/add', data)

/**
 * 购物车商品货品勾选状态
 * @param data { productIds: [], isChecked: 1/0 }
 */
export const checkCart = (data: Types.CheckedCartRequest) =>
  alovaInst.Post<any>('/wx/cart/checked', data)

/**
 * 计算账单
 * @param params addressId, cartId
 */
export const checkoutCart = (params: Types.CheckoutParams) =>
  alovaInst.Get<any>('/wx/cart/checkout', { params })

/**
 * 删除购物车
 * @param data { productIds: [] }
 */
export const deleteCart = (data: Types.DeleteCartRequest) =>
  alovaInst.Post<any>('/wx/cart/delete', data)

/**
 * 立即购买
 * @param data 购物车对象
 */
export const fastAddCart = (data: Types.FastAddCartRequest) =>
  alovaInst.Post<any>('/wx/cart/fastadd', data)

/**
 * 获取购物车商品数量
 */
export const getGoodsCount = (params: Types.CommonCartRequest) =>
  alovaInst.Get<any>('/wx/cart/goodscount', { params })

/**
 * 购物车信息
 */
export const getCartIndex = (params: Types.CommonCartRequest) =>
  alovaInst.Get<any>('/wx/cart/index', { params })

/**
 * 更新购物车
 * @param data 购物车对象
 */
export const updateCart = (data: Types.UpdateCartRequest) =>
  alovaInst.Post<any>('/wx/cart/update', data)
