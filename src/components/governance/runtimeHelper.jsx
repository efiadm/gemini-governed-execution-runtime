import { base44 } from "@/api/base44Client";

export async function callLLM(prompt, grounded) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt,
    add_context_from_internet: grounded,
  });
  return typeof result === "string" ? result : JSON.stringify(result);
}