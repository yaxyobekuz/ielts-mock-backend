const delay = (ms = 1000) => new Promise((res) => setTimeout(res, ms));

const getRandomNumber = (min = 0, max = 1) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const pickAllowedFields = (source, allowedFields = []) => {
  const updates = {};
  allowedFields.forEach((field) => {
    if (source[field] !== undefined) updates[field] = source[field];
  });
  return updates;
};

const countExactMatches = (text, target) => {
  return (
    (
      text?.match(
        new RegExp(target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")
      ) || []
    )?.length || 0
  );
};

const countSectionQuestions = ({ type, text, items, groups }) => {
  const dropzone = `<span data-name="dropzone"></span>`;
  const input = `<input type="text" data-name="answer-input">`;

  if (type === "text") {
    const totalInputs = countExactMatches(text, input);
    return totalInputs;
  }

  if (type === "text-draggable") {
    const totalDropzone = countExactMatches(text, dropzone);
    return totalDropzone;
  }

  if (type === "flowchart") {
    let totalDropzone = 0;
    items?.data?.forEach(({ text }) => {
      totalDropzone += countExactMatches(text, dropzone);
    });

    return totalDropzone;
  }

  if (type === "radio-group") {
    return groups?.length || 0;
  }

  return 0;
};

// Shuffle
const shuffleArray = (arr = []) => {
  if (!arr) return [];
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

module.exports = {
  delay,
  shuffleArray,
  getRandomNumber,
  pickAllowedFields,
  countExactMatches,
  countSectionQuestions,
};
