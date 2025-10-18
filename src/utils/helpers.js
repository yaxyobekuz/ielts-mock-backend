const delay = (ms = 1000) => new Promise((res) => setTimeout(res, ms));

const extractNumbers = (text = "") => {
  return text?.replace(/\D/g, "");
};

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

const getLetterByIndex = (index) => String.fromCharCode(65 + index);

const countSectionQuestions = ({ type, text, items, groups, grid }) => {
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

  if (type === "checkbox-group") {
    let count = 0;
    groups?.forEach((group) => (count += group.maxSelected));
    return count || 0;
  }

  if (type === "grid-matching") {
    return grid?.questions?.length || 0;
  }

  return 0;
};

const roundToNearestHalf = (num) => {
  return Math.round(num * 2) / 2;
};

const isEqualStringArray = (arr1, arr2) => {
  if (arr1.length !== arr2.length) return false;

  const normalize = (str) =>
    str
      .trim()
      .toLowerCase()
      .replace(/[.,!?;:]$/g, "");
  const sorted1 = arr1.map(normalize).sort();
  const sorted2 = arr2.map(normalize).sort();

  return sorted1.every((val, idx) => val === sorted2[idx]);
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
  extractNumbers,
  getRandomNumber,
  getLetterByIndex,
  pickAllowedFields,
  countExactMatches,
  roundToNearestHalf,
  isEqualStringArray,
  countSectionQuestions,
};
