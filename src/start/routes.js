const { app, express } = require("./index");

// Routes
const authRoute = require("../routes/auth");

app.use(express.json());
app.use("/api/auth", authRoute);
