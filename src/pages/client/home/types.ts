export type RecommendItem = {
  category?: number
  id: number
  serviceCode: string
  serviceTarget: string
  name: string
  brief: string
  type: number
  picUrl: string
  isOnSale: boolean
  isRecommend: boolean
  price: number
  costPrice: number
}

export type StoreViewItem = {
  id: number | string
  name: string
  score: number
  address: string
  distance: string
  hours: string
  tags: string[]
  image?: string
}

export type MenuItem = {
  title: string
  icon: string
  path?: string
}
