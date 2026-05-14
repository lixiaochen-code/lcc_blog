import { SetMetadata } from '@nestjs/common'

export const PUBLIC_KEY = 'isPublic'

/** Mark a route as not requiring authentication. */
export const Public = () => SetMetadata(PUBLIC_KEY, true)
