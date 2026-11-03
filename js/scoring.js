/* Word-level recognition coverage. This is not a phoneme/pronunciation score. */
class SpeakingScorer {
  static tokenize(text) {
    return (String(text || '').match(/[A-Za-z0-9]+(?:['’][A-Za-z0-9]+)*/g) || [])
      .map(word => word.toLowerCase().replace(/['’]/g, ''));
  }

  static compare(expectedText, spokenText) {
    const expected = this.tokenize(expectedText);
    const spoken = this.tokenize(spokenText);
    const n = expected.length;
    const m = spoken.length;
    const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));

    // Longest common subsequence respects word order and repeated words.
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        dp[i][j] = expected[i] === spoken[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }

    const matchedIndices = [];
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
      if (expected[i] === spoken[j]) {
        matchedIndices.push(i);
        i++;
        j++;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        i++;
      } else {
        j++;
      }
    }
    const correctWords = matchedIndices.length;
    return {
      matchedIndices,
      correctWords,
      totalWords: n,
      accuracy: n === 0 ? 0 : Math.round((correctWords / n) * 100)
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SpeakingScorer;
}
