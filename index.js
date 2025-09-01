require("dotenv").config();
const { app } = require("./src/start");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 4000;

(async () => {
  await connectDB();
  require("./src/start/routes");

  app.listen(PORT, () => {
    console.log(`Tinglamoqdaman: http://localhost:${PORT}`);
  });
})();
