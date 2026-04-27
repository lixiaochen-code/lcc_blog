export interface CarUserVehicles {
  addTime?: string
  brand?: string
  callName?: string
  color?: string
  coverUrl?: string
  deleted?: boolean
  id?: number
  isDefault?: boolean
  licensePlate?: string
  model?: string
  phone?: string
  updateTime?: string
}

export interface FindDefaultParams {
  userId?: number
}

export interface DeleteParams {
  id: number
  userId?: number
}

export interface DetailParams {
  id: number
  userId?: number
}

export interface ListParams {
  userId?: number
}

export type SaveParams = CarUserVehicles
export type EditParams = CarUserVehicles

export type FindDefaultResponse = CarUserVehicles
export type DeleteResponse = void
export type DetailResponse = CarUserVehicles
export type ListResponse = PagesRequest<CarUserVehicles>
export type SaveResponse = CarUserVehicles
export type EditResponse = CarUserVehicles
