const getModuleBandScore = (correctAnswers = 0, module = "listening") => {
  const tables = {
    listening: {
      40: 9,
      39: 9,
      38: 8.5,
      37: 8.5,
      36: 8,
      35: 8,
      34: 7.5,
      33: 7.5,
      32: 7.5,
      31: 7,
      30: 7,
      29: 6.5,
      28: 6.5,
      27: 6.5,
      26: 6.5,
      25: 6,
      24: 6,
      23: 6,
      22: 5.5,
      21: 5.5,
      20: 5.5,
      19: 5.5,
      18: 5.5,
      17: 5,
      16: 5,
      15: 4.5,
      14: 4.5,
      13: 4.5,
      12: 4,
      11: 4,
      0: 0,
    },
    reading: {
      40: 9,
      39: 9,
      37: 8.5,
      38: 8.5,
      35: 8,
      36: 8,
      33: 7.5,
      34: 7.5,
      30: 7,
      31: 7,
      32: 7,
      27: 6.5,
      28: 6.5,
      29: 6.5,
      23: 6,
      24: 6,
      25: 6,
      26: 6,
      19: 5.5,
      20: 5.5,
      21: 5.5,
      22: 5.5,
      15: 5,
      16: 5,
      17: 5,
      18: 5,
      13: 4.5,
      14: 4.5,
      10: 4,
      11: 4,
      12: 4,
      8: 3.5,
      9: 3.5,
      6: 3,
      7: 3,
      4: 2.5,
      5: 2.5,
      0: 0,
    },
  };

  const table = tables[module];
  if (!table) return null;

  // Find the score for the given number of correct answers
  if (table[correctAnswers] !== undefined) {
    return table[correctAnswers];
  }

  // If exact match not found, return 0 for very low scores
  return 0;
};

module.exports = { getModuleBandScore };
