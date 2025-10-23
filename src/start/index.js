const cors = require("cors");
const express = require("express");

// Models
require("../models/Part");
require("../models/User");
require("../models/Test");
require("../models/Link");
require("../models/Image");
require("../models/Result");
require("../models/Section");
require("../models/Template");
require("../models/Submission");
require("../models/VerificationCode");

const app = express();

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://ielts.mysrv.uz",
      "https://ieltsadmin.yaxyobek.uz",
      "https://ielts.yaxyobek.uz",
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS tomonidan bloklandi"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-auth-token"],
  maxAge: 86400,
};

app.use(cors(corsOptions));

module.exports = { app, express };
