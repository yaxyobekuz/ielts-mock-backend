const { app, express } = require("./index");

// Routes
const authRoute = require("../routes/auth");
const testsRoute = require("../routes/tests");
const partsRoute = require("../routes/parts");
const linksRoute = require("../routes/links");
const statsRoute = require("../routes/stats");
const usersRoute = require("../routes/users");
const resultRoute = require("../routes/result");
const uploadRoute = require("../routes/upload");
const sectionsRoute = require("../routes/sections");
const teachersRoute = require("../routes/teachers");
const templatesRoute = require("../routes/templates");
const userStatsRoute = require("../routes/userStats");
const submissionRoute = require("../routes/submission");

// Handlers
const errorHandler = require("../middlewares/errorHandler");

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

app.use("/api/auth", authRoute);
app.use("/api/users", usersRoute);
app.use("/api/tests", testsRoute);
app.use("/api/parts", partsRoute);
app.use("/api/links", linksRoute);
app.use("/api/stats", statsRoute);
app.use("/api/upload", uploadRoute);
app.use("/api/results", resultRoute);
app.use("/api/teachers", teachersRoute);
app.use("/api/sections", sectionsRoute);
app.use("/api/templates", templatesRoute);
app.use("/api/user-stats", userStatsRoute);
app.use("/api/submissions", submissionRoute);

app.use(errorHandler);
