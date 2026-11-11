/** Browsers set Host and Origin; compare the external host, not Next's internal hostname. */
export function requestOrigin(request: Request) {
  const url = new URL(request.url);
  return `${url.protocol}//${request.headers.get("host") ?? url.host}`;
}
export function sameOrigin(request: Request) {
  const host = request.headers.get("host");
  const origin = request.headers.get("origin");
  if(!host || !origin) return false;
  const protocol = new URL(request.url).protocol;
  return ["http:","https:"].includes(protocol) && origin === requestOrigin(request);
}
