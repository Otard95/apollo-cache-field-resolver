const nodeIdCacheKey = (
  nodeTypeName: string,
  nodeId: string | number,
  sessionId: string | null,
) => `${sessionId ? `<${sessionId}>` : ''}${nodeTypeName}.${nodeId}`
export default nodeIdCacheKey
