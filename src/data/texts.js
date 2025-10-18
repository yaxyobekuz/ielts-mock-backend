const { appendDotZero } = require("../utils/helpers");

const texts = {
  verificationCodeSent: (code) =>
    `<b>Hisobingizni tasdiqlash kodingiz:</b> <code>${code}</code>\nUshbu kodni hech kimga bermang, Hatto IELTS admini so'rasa ham!`,
  resultReady: (overall, reading, writing, speaking, listening) =>
    `🎉 <b>Sizning test natijangiz tayyor!</b>\n\n` +
    `🏆 <b>Umumiy ball:</b> <span class="tg-spoiler">${appendDotZero(
      overall
    )}</span>\n\n` +
    `📖 <b>Reading:</b> <span class="tg-spoiler">${appendDotZero(
      reading
    )}</span>\n` +
    `✍️ <b>Writing:</b> <span class="tg-spoiler">${appendDotZero(
      writing
    )}</span>\n` +
    `🗣 <b>Speaking:</b> <span class="tg-spoiler">${appendDotZero(
      speaking
    )}</span>\n` +
    `🎧 <b>Listening:</b> <span class="tg-spoiler">${appendDotZero(
      listening
    )}</span>\n\n` +
    `Batafsil ma'lumot uchun saytga kiring.`,
};

module.exports = texts;
