import childProcess from 'child_process'
import redis from 'ioredis'
import casual from 'casual'
import RedisKeyValueCache from '../src/redis-key-value-cache';

beforeAll(() => {
  childProcess.execSync('docker run -p 6379:6379 -d redis:6.2.6-alpine')
})
afterAll(() => {
  childProcess.execSync(`docker ps | grep 'redis:6.2.6-alpine' | awk '{print $1}' | xargs docker kill`)
})

const newRedis = () => new redis({
  port: 6379,
  host: 'localhost',
  connectionName: casual.uuid,
})

describe('InMemoryCache', () => {

  describe('When getting unset key', () => {
    const cache = new RedisKeyValueCache({ client: newRedis() })
    it('should return null', () => {
      expect(cache.get('key')).resolves.toBeNull()
    })
  })

  describe('When getting a set key', () => {
    const cache = new RedisKeyValueCache({ client: newRedis() })
    cache.set('key', 'value', 1000)
    it('should return stored value', () => {
      expect(cache.get('key')).resolves.toEqual('value')
    })
  })

  describe('After deleting a key', () => {
    const cache = new RedisKeyValueCache({ client: newRedis() })
    it('.get(...) should return null', () => {
      // await cache.set('key', 'value', 1000)
      // await cache.delete('key')
      expect(cache.get('key')).resolves.toBeNull()
    })
  })

  describe('When setting a key with ttl', () => {
    const spy = jest.spyOn(global.Date, 'now')
    spy.mockImplementationOnce(() => 0)

    const cache = new RedisKeyValueCache({ client: newRedis() })
    cache.set('key', 'value', 10)
    it('should return the value before the ttl expires', () => {
      spy.mockImplementationOnce(() => 0)
      expect(cache.get('key')).resolves.toEqual('value')
    })
    it('should return null after the ttl expires', () => {
      spy.mockImplementationOnce(() => 15000)
      expect(cache.get('key')).resolves.toBeNull()
    })
  })
})
