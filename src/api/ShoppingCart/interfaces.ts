export interface MallCart {
  addTime?: string
  checked?: boolean
  deleted?: boolean
  freightTemplateId?: number
  goodsId?: number
  goodsName?: string
  goodsSn?: string
  id?: number
  isPostage?: number
  number?: number
  picUrl?: string
  price?: number
  productId?: number
  specifications?: string[]
  storeId?: number
  storeLogo?: string
  storeName?: string
  updateTime?: string
  userId?: number
}

export interface AddCartRequest {
  cart: MallCart
  userId?: number
}

export interface CheckedCartRequest {
  /** { productIds: [], isChecked: 1/0 } */
  body: string
  userId?: number
}

export interface CheckoutParams {
  addressId?: number
  cartId?: number
}

export interface DeleteCartRequest {
  /** { productIds: [] } */
  body: string
  userId?: number
}

export interface FastAddCartRequest {
  cart: MallCart
  userId?: number
}

export interface CommonCartRequest {
  userId?: number
}

export interface UpdateCartRequest {
  cart: MallCart
  userId?: number
}
