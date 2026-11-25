import { supabase } from "@/lib/supabase/server";
import { handleMfa } from "@/lib/mfa-handler";

export async function POST(request: Request) {
  return handleMfa(request,async () => (await supabase()).auth);
}
