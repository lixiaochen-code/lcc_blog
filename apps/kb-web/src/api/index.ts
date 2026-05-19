export * from './types'
export * from './http'
export * from './auth.api'
export * from './kb.api'
export * from './ai.api'
export * from './admin.api'
export * from './web.api'

import { auth } from './auth.api'
import { kb } from './kb.api'
import { ai } from './ai.api'
import { admin } from './admin.api'
import { web } from './web.api'

/**
 * Aggregate of every domain api object. Preserves the `api.xxx(...)`
 * ergonomics from before the split — only domain-internal callers need to
 * import from a specific sub-module.
 */
export const api = {
  ...auth,
  ...kb,
  ...ai,
  ...admin,
  ...web,
}
