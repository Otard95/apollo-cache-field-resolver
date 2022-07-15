import InMemoryCache from '../src/in-memory-cache'

describe('InMemoryCache', () => {

  describe('When getting unset key', () => {
    const cache = new InMemoryCache()
    it('should return undefined', () => {
      expect(cache.get('key')).resolves.toBeUndefined()
    })
  })

  describe('When setting a key', () => {
    const cache = new InMemoryCache()
    it('should be stored in internal Map', () => {
      cache.set('key', 'value', { ttl: 1000 })
      expect((cache as any).cache.has('key')).toEqual(true)
    })
  })

  describe('When getting a set key', () => {
    const cache = new InMemoryCache()
    cache.set('key', 'value', { ttl: 1000 })
    it('should return stored value', () => {
      expect(cache.get('key')).resolves.toEqual('value')
    })
  })

  describe('When deleting a key', () => {
    const cache = new InMemoryCache()
    cache.set('key', 'value', { ttl: 1000 })
    it('should remove key from internal Map', () => {
      cache.delete('key')
      expect((cache as any).cache.has('key')).toEqual(false)
    })
  })

  describe('When setting a key with ttl', () => {
    const spy = jest.spyOn(global.Date, 'now')
    spy.mockImplementationOnce(() => 0)

    const cache = new InMemoryCache()
    cache.set('key', 'value', { ttl: 10 })
    it('should return the value before the ttl expires', () => {
      spy.mockImplementationOnce(() => 0)
      expect(cache.get('key')).resolves.toEqual('value')
    })
    it('should return null after the ttl expires', () => {
      spy.mockImplementationOnce(() => 15000)
      expect(cache.get('key')).resolves.toBeUndefined()
    })
  })
})
