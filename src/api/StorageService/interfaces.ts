export interface File {
  absolute?: boolean
  absoluteFile?: File
  absolutePath?: string
  canonicalFile?: File
  canonicalPath?: string
  directory?: boolean
  file?: boolean
  freeSpace?: number
  hidden?: boolean
  name?: string
  parent?: string
  parentFile?: File
  path?: string
  totalSpace?: number
  usableSpace?: number
}

export interface InputStream {}

export interface URI {
  absolute?: boolean
  authority?: string
  fragment?: string
  host?: string
  opaque?: boolean
  path?: string
  port?: number
  query?: string
  rawAuthority?: string
  rawFragment?: string
  rawPath?: string
  rawQuery?: string
  rawSchemeSpecificPart?: string
  rawUserInfo?: string
  scheme?: string
  schemeSpecificPart?: string
  userInfo?: string
}

export interface URL {
  authority?: string
  content?: any
  defaultPort?: number
  file?: string
  host?: string
  path?: string
  port?: number
  protocol?: string
  query?: string
  ref?: string
  userInfo?: string
}

export interface ResourceResponse {
  description?: string
  file?: File
  filename?: string
  inputStream?: InputStream
  open?: boolean
  readable?: boolean
  uri?: URI
  url?: URL
}

export interface UploadImageBase64Params {
  /** base64 */
  base64: string
  /** 文件名称 */
  fileName?: string
  /** 文件后缀 */
  suffix: string
}

// TODO: 待真实接口验证，以下为模拟类型
// 预期响应示例: { "url": "https://xxx.com/storage/abc.png", "key": "abc.png" }
export interface UploadImageResponse {
  /** 图片访问地址 */
  url: string
  /** 存储 key */
  key?: string
}
