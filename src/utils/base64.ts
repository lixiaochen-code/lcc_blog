/**
 * 简单的 Base64 解码工具 (兼容处理)
 */
export function base64Decode(str: string): string {
  // H5 环境直接用原生的
  // #ifdef H5
  try {
    return decodeURIComponent(
      atob(str)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        })
        .join('')
    )
  } catch (e) {
    return atob(str)
  }
  // #endif

  // 非 H5 环境 (小程序/App) 使用纯 JS 实现
  // #ifndef H5
  // eslint-disable-next-line no-unreachable
  return _base64DecodePolyfill(str)
  // #endif
}

// 内部实现：纯 JS 解码逻辑
function _base64DecodePolyfill(input: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
  let str = input.replace(/=+$/, '')
  let output = ''

  if (str.length % 4 == 1) {
    throw new Error("'atob' failed: The string to be decoded is not correctly encoded.")
  }

  for (
    let bc = 0, bs = 0, buffer, i = 0;
    (buffer = str.charAt(i++));
    ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
      ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
      : 0
  ) {
    buffer = chars.indexOf(buffer)
  }

  // 处理中文乱码：将解码后的 ASCII 字符串还原为 UTF-8
  try {
    return decodeURIComponent(escape(output))
  } catch (e) {
    return output
  }
}
