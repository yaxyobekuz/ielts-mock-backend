const Test = require("../models/Test");

const extractSectionAnswers = ({
  type,
  groups,
  answers,
  options,
  questionsCount,
}) => {
  let result = [];

  // Text
  if (type === "text") {
    Array.from({ length: questionsCount }, (_, index) => {
      result.push(answers[index]?.text?.trim()?.toLowerCase() || "");
    });

    return result;
  }

  // Text Draggable or Flowchart
  if (type === "text-draggable" || type === "flowchart") {
    Array.from({ length: questionsCount }, (_, index) => {
      result.push(options.data[index]?.option?.trim()?.toLowerCase() || "");
    });

    return result;
  }

  // Radio Group
  if (type === "radio-group") {
    groups.forEach((group) => {
      const answer = group.answers[group.correctAnswerIndex];
      result.push(answer?.text?.trim()?.toLowerCase() || "");
    });

    return result;
  }
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
          const sectionAnswers = extractSectionAnswers(section);
          sectionAnswers.forEach((answer) => {
            answers[module][questionNumber] = answer;
            questionNumber++;
          });
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
