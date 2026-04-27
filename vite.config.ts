import { CommonServerOptions, defineConfig, loadEnv } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
// @ts-ignore
import UnoCSS from '@unocss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxy: CommonServerOptions['proxy'] =
    process.env.UNI_PLATFORM === 'h5'
      ? {
          '/api': {
            target: env.VITE_APP_SERVER_URL,
            changeOrigin: true,
            rewrite: path => path.replace(/^\/api/, ''),
          },
          '/location': {
            target: 'https://apis.map.qq.com',
            changeOrigin: true,
            rewrite: path => path.replace(/^\/location/, ''),
          },
        }
      : {}
  console.log(proxy)
  return {
    plugins: [
      uni({
        vueOptions: {
          template: {
            compilerOptions: {
              isCustomElement: tag => tag === 'root-portal',
            },
          },
        },
      }),
      UnoCSS(),
    ],
    server: {
      proxy,
      open: true,
    },
    build: {
      terserOptions: {
        compress: {
          drop_console: false,
          drop_debugger: false,
        },
      },
    },
  }
})
