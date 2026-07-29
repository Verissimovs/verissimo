export interface ReadabilityScore {
  sentenceCount: number;
  wordCount: number;
  syllableCount: number;
  fleschReadingEase: number;
  fleschKincaidGrade: number;
}

export interface ReadabilityAuditItem extends ReadabilityScore {
  id: string;
  text: string;
  passes: boolean;
}

export function scoreReadability(text: string): ReadabilityScore {
  const sentences = splitSentences(text);
  const words = splitWords(text);
  const syllables = words.reduce((total, word) => total + countSyllables(word), 0);
  const sentenceCount = Math.max(sentences.length, 1);
  const wordCount = Math.max(words.length, 1);
  const syllableCount = Math.max(syllables, 1);
  const wordsPerSentence = wordCount / sentenceCount;
  const syllablesPerWord = syllableCount / wordCount;

  return {
    sentenceCount,
    wordCount,
    syllableCount,
    fleschReadingEase: round(206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord),
    fleschKincaidGrade: round(0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59),
  };
}

export function auditReadability(
  texts: Array<{ id: string; text: string }>,
  options: { maxFleschKincaidGrade: number; minWordCount?: number },
): ReadabilityAuditItem[] {
  return texts.map(({ id, text }) => {
    const score = scoreReadability(text);

    return {
      id,
      text,
      ...score,
      passes:
        score.wordCount < (options.minWordCount ?? 1) ||
        score.fleschKincaidGrade <= options.maxFleschKincaidGrade,
    };
  });
}

function splitSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function splitWords(text: string): string[] {
  return text
    .toLowerCase()
    .match(/[a-z]+(?:'[a-z]+)?/g) ?? [];
}

function countSyllables(word: string): number {
  const normalised = word
    .toLowerCase()
    .replace(/'s$/, '')
    .replace(/[^a-z]/g, '');

  if (!normalised) return 1;
  if (normalised.length <= 3) return 1;

  const withoutSilentE = normalised.replace(/e$/, '');
  const groups = withoutSilentE.match(/[aeiouy]+/g);

  return Math.max(groups?.length ?? 1, 1);
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}
