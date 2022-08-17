const redis = require('ioredis-mock')
import RedisKeyValueCache from '../src/redis-key-value-cache'

let newRedis: any
let cache: RedisKeyValueCache

describe('InMemoryCache', () => {
  beforeEach(async() => {
    newRedis = new redis()
    cache = new RedisKeyValueCache({ client: newRedis })
  })

  afterEach(async() => {
    await new redis().flushall()
  })

  describe('When getting unset key', () => {
    it('should return null', () => {
      expect(cache.get('key')).resolves.toBeUndefined()
    })
  })

  describe('When getting a set key', () => {
    beforeEach(async() => {
      await cache.set('key', 'value', 1000)
    })
    it('should return stored value', () => {
      expect(cache.get('key')).resolves.toEqual('value')
    })
  })

  describe('After deleting a key', () => {
    it('.get(...) should return null', async() => {
      await cache.set('key', 'value', 1000)
      await cache.delete('key')
      expect(cache.get('key')).resolves.toBeUndefined()
    })
  })

  describe('When setting a key with ttl', () => {
    it('should return the value before the ttl expires', async() => {
      await cache.set('key', 'value', 10)
      expect(cache.get('key')).resolves.toEqual('value')
    })
    it('should return null after the ttl expires', async() => {
      await cache.set('key', 'value', 1)
      await new Promise(resolve => setTimeout(resolve, 1200))
      expect(cache.get('key')).resolves.toBeUndefined()
    })
  })
})
