const delay = (ms = 1000) => new Promise((res) => setTimeout(res, ms));

const getRandomNumber = (min = 0, max = 1) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

module.exports = { delay, getRandomNumber };
