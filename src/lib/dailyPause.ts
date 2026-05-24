// Deterministic "pause of the day" selection for the session cold-start.
//
// Picking a prompt at random on every load makes the entry screen feel
// arbitrary and means a reload throws away what you were about to do. Instead
// we seed the choice by the local calendar day: everyone gets the same pause
// on a given day, it stays put if you reload, and it rotates day to day. Pure
// and dependency-free so it unit tests without a DB (dailyPause.test.ts).

export function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Stable index into a list of `count` items for the given day. Returns 0 for an
// empty or single-item list. The caller must order the list deterministically
// (e.g. sort by id) before indexing, since DB row order is not guaranteed.
export function dailyPromptIndex(date: Date, count: number): number {
  if (count <= 1) return 0;
  const key = dateKey(date);
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash % count;
}
