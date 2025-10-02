export function between(min, max) {
  return Math.random() * (max - min) + min;
}

export function intBetween(min, max) {
  return Math.floor(between(min, max + 1));
}

export function chance(probability) {
  return Math.random() < probability;
}

export function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export function weightedPick(entries) {
  const total = entries.reduce((sum, { weight }) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const entry of entries) {
    if ((roll -= entry.weight) <= 0) {
      return entry.value;
    }
  }
  return entries[entries.length - 1].value;
}

export function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
