/** Display-only reference. Keep the full UUID in routes, mutations and audit records. */
export function displayReference(kind: "contact" | "booking", id: string): string {
  const compact = id.replaceAll("-", "").slice(0, 16).toUpperCase();
  return `${kind === "contact" ? "CT" : "BK"}-${compact}`;
}
