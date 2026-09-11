/** Extracts the sentence mentioning "차박" (car camping) straight from
 *  the campsite's own description, if any. GoCamping has no
 *  structured yes/no field for this, and only ~20 of 3000+ campsites
 *  mention it at all — so we surface the source's own wording
 *  verbatim instead of guessing at a possible/impossible verdict. */
export function extractCarCampingNote(intro: string): string | null {
  if (!intro.includes("차박")) return null;

  const sentences = intro.split(/(?<=[.!?])\s+|\n+/);
  const match = sentences.find((s) => s.includes("차박"));
  return match ? match.trim() : null;
}
