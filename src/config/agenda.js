const Agenda = require("agenda");
const mongoose = require("mongoose");

// Agenda instance yaratish
const agenda = new Agenda({
  mongo: mongoose.connection,
  db: { collection: "agendaJobs" },
  processEvery: "10 seconds",
  maxConcurrency: 20,
});

// Graceful shutdown
const graceful = () => {
  agenda.stop(() => {
    console.log("Agenda ishdan to'xtadi");
    process.exit(0);
  });
};

process.on("SIGTERM", graceful);
process.on("SIGINT", graceful);

module.exports = agenda;
