// Tiny localStorage-backed memory of user category corrections.
// Maps a normalized note keyword -> categoryId (last user choice wins).

const KEY = "lumen.catmemory.v1";

function read(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}
function write(map: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* ignore quota */
  }
}

function tokens(note: string): string[] {
  return note
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 3);
}

export function recallCategory(note: string): string | null {
  const map = read();
  for (const t of tokens(note)) {
    if (map[t]) return map[t];
  }
  return null;
}

export function rememberCategory(note: string, categoryId: string) {
  const map = read();
  for (const t of tokens(note)) {
    map[t] = categoryId;
  }
  write(map);
}