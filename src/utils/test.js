const Test = require("../models/Test");

const extractSectionAnswers = (
  { type, groups, answers, options, questionsCount },
  initialQuestionNumber
) => {
  let correctAnswers = {};
  let questionNumber = initialQuestionNumber || 0;

  // Text
  if (type === "text") {
    Array.from({ length: questionsCount }, (_, index) => {
      correctAnswers[questionNumber] =
        answers[index]?.text?.trim()?.toLowerCase() || "";

      questionNumber++;
    });
  }

  // Text Draggable or Flowchart
  else if (type === "text-draggable" || type === "flowchart") {
    Array.from({ length: questionsCount }, (_, index) => {
      correctAnswers[questionNumber] =
        options.data[index]?.option?.trim()?.toLowerCase() || "";

      questionNumber++;
    });
  }

  // Radio Group
  else if (type === "radio-group") {
    groups.forEach((group) => {
      const answer = group.answers[group.correctAnswerIndex];
      correctAnswers[questionNumber] =
        answer?.text?.trim()?.toLowerCase() || "";

      questionNumber++;
    });
  }

  // Checkbox Group
  else if (type === "checkbox-group") {
    groups.forEach((group) => {
      let answer = "";

      group.correctAnswersIndex?.map((index) => {
        answer +=
          (group.answers[index]?.text?.trim()?.toLowerCase() || "") + " ";
      });

      const answerKey = `${questionNumber}-${
        questionNumber + group.maxSelected - 1
      }`;
      correctAnswers[answerKey] = answer.trim();

      questionNumber += group.maxSelected;
    });
  }

  return { answers: correctAnswers, totalAnswers: questionsCount };
};

const getTestAnswers = async (testId) => {
  try {
    const test = await Test.findById(testId)
      .populate("createdBy", "firstName lastName role avatar")
      .populate({
        populate: { path: "sections", model: "Section" },
        path: "listening.parts reading.parts writing.parts",
      })
      .lean();

    if (!test) return null;

    const answers = { reading: {}, listening: {} };

    // Loop modules
    ["reading", "listening"].forEach((module) => {
      let questionNumber = 1;
      if (!test[module]?.parts?.length) return;

      test[module].parts.forEach((part) => {
        if (!part.sections?.length) return;

        part.sections.forEach((section) => {
          const { answers: sectionAnswers, totalAnswers } =
            extractSectionAnswers(section, questionNumber);

          questionNumber += totalAnswers;
          answers[module] = { ...answers[module], ...sectionAnswers };
        });
      });
    });

    return answers;
  } catch (err) {
    console.error(err);
    return null;
  }
};

module.exports = { getTestAnswers };
