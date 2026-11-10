export type Search = Promise<Record<string, string | string[] | undefined>>;
export async function pageQuery(search: Search) {
  const input = await search;
  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(input))
    if (typeof value === "string" && value.trim()) query[key] = value;
  const page = Number(query.page ?? 1),
    pageSize = Number(query.pageSize ?? 12);
  query.page = String(
    Number.isInteger(page) && page > 0 && page <= 100000 ? page : 1,
  );
  query.pageSize = String(
    Number.isInteger(pageSize) && pageSize > 0 && pageSize <= 100
      ? pageSize
      : 12,
  );
  return query;
}
