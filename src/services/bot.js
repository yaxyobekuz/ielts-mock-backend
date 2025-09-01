const axios = require("axios");

const BOT_TOKEN = process.env.BOT_TOKEN;
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

const sendMessage = async (chatId, text) => {
  try {
    await axios.post(`${BASE_URL}/sendMessage`, {
      text,
      chat_id: chatId,
      parse_mode: "HTML",
    });
    return true;
  } catch (err) {
    return false;
  }
};

module.exports = { sendMessage };
