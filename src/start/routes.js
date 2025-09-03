const { app, express } = require("./index");

// Routes
const authRoute = require("../routes/auth");
const testsRoute = require("../routes/tests");

app.use(express.json());
app.use("/api/auth", authRoute);
app.use("/api/tests", testsRoute);
