export type Search = Promise<Record<string, string | string[] | undefined>>;
export async function pageQuery(search: Search, filters: readonly string[] = [], values: Record<string,readonly string[]> = {}) {
  const input = await search;
  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(input))
    if (["page", "pageSize", ...filters].includes(key) && typeof value === "string" && value.trim()) query[key] = value.trim();
  const page = Number(query.page ?? 1),
    pageSize = Number(query.pageSize ?? 20);
  query.page = String(
    Number.isInteger(page) && page > 0 && page <= 100000 ? page : 1,
  );
  query.pageSize = String(
    Number.isInteger(pageSize) && pageSize > 0 && pageSize <= 100
      ? pageSize
      : 20,
  );
  for (const key of ["q", "area", "category"]) if(query[key]) query[key] = query[key].slice(0,100);
  if (query.age && (!/^\d+$/.test(query.age) || Number(query.age) > 18)) delete query.age;
  if (query.state && !["REQUESTED","OFFER_PENDING","PAYMENT_DUE","PAYMENT_CHECKING","CONFIRMED","DECLINED","EXPIRED","CANCELLED"].includes(query.state)) delete query.state;
  if (query.status && !["pending","approved","rejected","suspended","open","in_progress","resolved"].includes(query.status)) delete query.status;
  if (query.owned && !["true","false"].includes(query.owned)) delete query.owned;
  for(const [key,allowed] of Object.entries(values)) if(query[key] && !allowed.includes(query[key])) delete query[key];
  return query;
}
