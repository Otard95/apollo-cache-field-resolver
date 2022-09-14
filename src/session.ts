import { CacheHint } from 'apollo-server-types'
import { CacheOptions } from './types'

const generateSessionId = <P, C, A>(
  sessionId: CacheOptions<P, C, A>['sessionId'],
  context: C,
  cacheHint: CacheHint,
): string | null => {
  if (cacheHint.scope !== 'PRIVATE') return ''
  if (!sessionId) return null
  return typeof sessionId === 'function'
    ? sessionId(context)
    : sessionId
}

export default generateSessionId
