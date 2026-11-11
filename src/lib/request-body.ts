import { RequestError } from "./http";
export async function jsonBody(request: Request, limit: number): Promise<Record<string,unknown>> {
  if(!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))
    throw new RequestError(415,"JSON is required.");
  const reader = request.body?.getReader();
  if(!reader) throw new RequestError(400,"Invalid request body.");
  let size = 0, text = "";
  const decoder = new TextDecoder();
  try {
    while(true) {
      const {done,value} = await reader.read();
      if(done) break;
      size += value.byteLength;
      if(size > limit) { await reader.cancel(); throw new RequestError(413,"Request too large."); }
      text += decoder.decode(value,{stream:true});
    }
    text += decoder.decode();
  } finally { reader.releaseLock(); }
  try {
    const body: unknown = JSON.parse(text);
    if(!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return body as Record<string,unknown>;
  } catch { throw new RequestError(400,"Invalid request body."); }
}
