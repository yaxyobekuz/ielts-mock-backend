const { app, express } = require("./index");

// Routes
const authRoute = require("../routes/auth");
const testsRoute = require("../routes/tests");
const partsRoute = require("../routes/parts");
const sectionsRoute = require("../routes/sections");

app.use(express.json());
app.use("/api/auth", authRoute);
app.use("/api/tests", testsRoute);
app.use("/api/parts", partsRoute);
app.use("/api/sections", sectionsRoute);
