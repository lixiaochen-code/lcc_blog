import type { Preset, SourceCodeTransformer } from 'unocss'
import { defineConfig } from 'unocss'

import { presetApplet, presetRemRpx, transformerAttributify } from 'unocss-applet'

const isApplet = process.env?.UNI_PLATFORM?.startsWith('mp-') ?? false
const presets: Preset[] = []
const transformers: SourceCodeTransformer[] = []

if (isApplet) {
  presets.push(presetApplet())
  presets.push(presetRemRpx())
} else {
  presets.push(presetApplet())
  presets.push(presetRemRpx({ mode: 'rpx2rem' }))
}

export default defineConfig({
  presets: [
    // ...
    ...presets,
  ],
  transformers: [
    // ...
    ...transformers,
  ],
})
