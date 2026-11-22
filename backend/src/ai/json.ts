export function extractJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? trimmed).trim();

  try {
    return JSON.parse(candidate) as unknown;
  } catch {
    // Fall through to extracting the first JSON object from surrounding text.
  }

  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Respons AI tidak mengandung objek JSON');
  }

  const jsonSlice = candidate.slice(start, end + 1);

  try {
    return JSON.parse(jsonSlice) as unknown;
  } catch (error) {
    throw new Error(
      `Respons AI bukan JSON yang valid: ${error instanceof Error ? error.message : 'unknown error'}`,
    );
  }
}

export function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength)}...`;
}
