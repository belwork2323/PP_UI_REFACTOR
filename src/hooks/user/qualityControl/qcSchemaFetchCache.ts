import type { SchemaDocumentV2 } from "../../../schema-engine";

const inflightSchemaFetches = new Map<string, Promise<SchemaDocumentV2 | null>>();

export const fetchQcSchemaWithInflightDedup = (
  cacheKey: string,
  fetcher: () => Promise<SchemaDocumentV2 | null>,
): Promise<SchemaDocumentV2 | null> => {
  const existing = inflightSchemaFetches.get(cacheKey);
  if (existing) return existing;

  const promise = fetcher().finally(() => {
    inflightSchemaFetches.delete(cacheKey);
  });
  inflightSchemaFetches.set(cacheKey, promise);
  return promise;
};

export const mapWithConcurrency = async <T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> => {
  if (!items.length) return [];
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < items.length) {
      const current = nextIndex;
      nextIndex += 1;
      results[current] = await mapper(items[current]!);
    }
  };

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
};
