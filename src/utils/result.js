const { roundToNearestHalf, isEqualStringArray } = require("./helpers");

const formatResultModulesCriteria = ({ writing = [], speaking = [] }) => {
  return {
    writingCriteria: {
      task1: {
        taskAchievement: Number(writing?.[0]?.taskAchievement) || 0,
        lexicalResource: Number(writing?.[0]?.lexicalResource) || 0,
        coherenceAndCohesion: Number(writing?.[0]?.coherenceAndCohesion) || 0,
        grammaticalRangeAndAccuracy:
          Number(writing?.[0]?.grammaticalRangeAndAccuracy) || 0,
      },
      task2: {
        taskResponse: Number(writing?.[1]?.taskResponse) || 0,
        lexicalResource: Number(writing?.[1]?.lexicalResource) || 0,
        coherenceAndCohesion: Number(writing?.[1]?.coherenceAndCohesion) || 0,
        grammaticalRangeAndAccuracy:
          Number(writing?.[1]?.grammaticalRangeAndAccuracy) || 0,
      },
    },

    speakingCriteria: {
      pronunciation: Number(speaking?.[0]?.pronunciation) || 0,
      lexicalResource: Number(speaking?.[0]?.lexicalResource) || 0,
      fluencyAndCoherence: Number(speaking?.[0]?.fluencyAndCoherence) || 0,
      grammaticalRangeAndAccuracy:
        Number(speaking?.[0]?.grammaticalRangeAndAccuracy) || 0,
    },
  };
};

const calculateBandScores = ({ writingCriteria, speakingCriteria }) => {
  let writing = 0;
  let speaking = 0;

  if (writingCriteria) {
    const task1Scores = Object.values(writingCriteria.task1 || {});
    const task2Scores = Object.values(writingCriteria.task2 || {});

    const task1Avg =
      task1Scores.length > 0
        ? task1Scores.reduce((a, b) => a + b, 0) / task1Scores.length
        : 0;

    const task2Avg =
      task2Scores.length > 0
        ? task2Scores.reduce((a, b) => a + b, 0) / task2Scores.length
        : 0;

    writing = (task1Avg + task2Avg) / 2;
  }

  if (speakingCriteria) {
    const speakingScores = Object.values(speakingCriteria || {});

    speaking =
      speakingScores.length > 0
        ? speakingScores.reduce((a, b) => a + b, 0) / speakingScores.length
        : 0;
  }

  return {
    writing: roundToNearestHalf(writing),
    speaking: roundToNearestHalf(speaking),
  };
};

const countCorrectAnswers = (answers, correctAnswers) => {
  let count = 0;

  for (const key in correctAnswers) {
    if (answers[key]) {
      if (typeof answers[key] === "object") {
        if (isEqualStringArray(answers[key], correctAnswers[key])) count++;
      } else {
        const answer = answers[key]?.trim()?.toLowerCase();
        const correctAnswer = correctAnswers[key]?.trim()?.toLowerCase();
        if (answer === correctAnswer) count++;
      }
    }
  }

  return count;
};

module.exports = {
  calculateBandScores,
  countCorrectAnswers,
  formatResultModulesCriteria,
};
