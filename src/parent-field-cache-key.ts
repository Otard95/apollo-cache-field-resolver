const parentFieldCacheKey = (
  parentTypeName: string,
  parentId: string | number,
  fieldName: string,
  args: unknown,
  sessionId: string | null,
) => `${sessionId
        ? `<${sessionId}>`
        : ''
        }${parentTypeName}{${parentId}}.${fieldName}(${JSON.stringify(
          args
        )})`
export default parentFieldCacheKey
