export function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeList(items) {
  const seen = new Set();
  const result = [];
  items.forEach((item) => {
    const clean = String(item || "").trim();
    const key = normalizeText(clean);
    if (clean && !seen.has(key)) {
      seen.add(key);
      result.push(clean);
    }
  });
  return result;
}

export function toTitleCase(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("vi")
    .replace(/\s+/g, " ")
    .split(/(\s+|-)/)
    .map((part) => {
      if (!/\p{L}/u.test(part)) return part;
      if (["tp", "bd", "su"].includes(part)) return part.toLocaleUpperCase("vi");
      return part.replace(/^(\p{L})/u, (char) => char.toLocaleUpperCase("vi"));
    })
    .join("");
}

export function parseManyNames(value) {
  return normalizeList(
    String(value || "")
      .split(/\r?\n|,|\s+-\s+|-/)
      .map((item) => item.replace(/^1 ngàn$/i, "Một Ngàn"))
      .map((item) => toTitleCase(item.trim()))
      .filter(Boolean)
  );
}
