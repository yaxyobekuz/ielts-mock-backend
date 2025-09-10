const { app, express } = require("./index");

// Routes
const authRoute = require("../routes/auth");
const testsRoute = require("../routes/tests");
const partsRoute = require("../routes/parts");
const linksRoute = require("../routes/links");
const uploadRoute = require("../routes/upload");
const sectionsRoute = require("../routes/sections");

// Handlers
const errorHandler = require("../middlewares/errorHandler");

app.use(express.json());
app.use("/api/auth", authRoute);
app.use("/api/tests", testsRoute);
app.use("/api/parts", partsRoute);
app.use("/api/links", linksRoute);
app.use("/api/upload", uploadRoute);
app.use("/api/sections", sectionsRoute);

app.use(errorHandler);
