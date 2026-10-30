/** Lee un stream SSE de Workers AI y entrega los fragmentos de texto (formato clásico o compatible con OpenAI). */
export async function readAiStream(stream: ReadableStream<Uint8Array>, onText: (chunk: string) => void) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) handleLine(line, onText);
  }
  if (buffer) handleLine(buffer, onText);
}

function handleLine(line: string, onText: (chunk: string) => void) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return;
  const data = trimmed.slice(5).trim();
  if (!data || data === "[DONE]") return;
  try {
    const json = JSON.parse(data) as { response?: unknown; choices?: { delta?: { content?: unknown } }[] };
    const text = typeof json.response === "string" ? json.response : json.choices?.[0]?.delta?.content;
    if (typeof text === "string" && text) onText(text);
  } catch {}
}
