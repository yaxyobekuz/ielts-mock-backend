const delay = (ms = 1000) => new Promise((res) => setTimeout(res, ms));

module.exports = { delay };
