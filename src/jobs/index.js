const agenda = require("../config/agenda");

/**
 * Load all job definitions
 */
const loadJobs = () => {
  // Teacher jobs
  require("./teacherJobs");
  console.log("Agenda job'lari yuklandi ✅");
};

/**
 * Start Agenda
 */
const startAgenda = async () => {
  try {
    // Job'larni yuklash
    loadJobs();

    // Agenda'ni ishga tushirish
    await agenda.start();

    console.log("Agenda muvaffaqiyatli ishga tushdi ✅");
  } catch (error) {
    console.error("Agenda'ni ishga tushirishda xatolik ❌ ", error);
    throw error;
  }
};

module.exports = {
  loadJobs,
  startAgenda,
};
