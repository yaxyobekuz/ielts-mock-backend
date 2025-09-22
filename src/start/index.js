const cors = require("cors");
const express = require("express");

// Models
require("../models/Part");
require("../models/User");
require("../models/Test");
require("../models/Result");
require("../models/Section");
require("../models/VerificationCode");

const app = express();
app.use(cors());

module.exports = { app, express };
