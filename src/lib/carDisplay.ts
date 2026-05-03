/** Comma-separated category tags from admin (e.g. "Sedan, Manual"). */
export function parseCategoryTokens(categoryText: string): string[] {
  return categoryText
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
}

export type TransmissionKind = "manual" | "automatic";

/** Recognizes transmission when listed as its own category tag (Manual, Automatic, CVT, etc.). */
export function transmissionFromCategoryTokens(tokens: string[]): TransmissionKind | null {
  for (const token of tokens) {
    const kind = classifyTransmissionToken(token);
    if (kind) {
      return kind;
    }
  }
  return null;
}

export function classifyTransmissionToken(token: string): TransmissionKind | null {
  const t = token.trim().toLowerCase();
  if (!t) {
    return null;
  }

  if (
    t === "manual" ||
    t === "mt" ||
    t === "m/t" ||
    t === "stick" ||
    t === "stick shift" ||
    /\bmanual\b/.test(t) ||
    /\bmt\b/.test(t) ||
    /\bstick\b/.test(t)
  ) {
    return "manual";
  }

  if (
    t === "automatic" ||
    t === "auto" ||
    t === "at" ||
    t === "a/t" ||
    t === "cvt" ||
    t === "dsg" ||
    t === "amt" ||
    /\bautomatic\b/.test(t) ||
    /\bcvt\b/.test(t) ||
    /\bdsg\b/.test(t)
  ) {
    return "automatic";
  }

  return null;
}

export function categoryTokensWithoutTransmission(tokens: string[]): string[] {
  return tokens.filter((token) => !classifyTransmissionToken(token));
}
