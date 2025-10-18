const axios = require("axios");

const BOT_TOKEN = process.env.BOT_TOKEN;
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

const sendMessage = async (chatId, text, options = {}) => {
  try {
    await axios.post(`${BASE_URL}/sendMessage`, {
      text,
      chat_id: chatId,
      parse_mode: "HTML",
      reply_markup: options,
    });
    return true;
  } catch {
    return false;
  }
};

module.exports = { sendMessage };
