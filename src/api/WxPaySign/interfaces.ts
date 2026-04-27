export interface GetSignParams {
  /**
   * appId
   */
  appId: string
  /**
   * otp
   */
  otp: string
  /**
   * shopId
   */
  shopId: string
}

export interface GetSignResponse {
  [key: string]: any
}
