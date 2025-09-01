const mongoose = require("mongoose");
const User = require("../models/User");
const MONGODB_URL = process.env.MONGODB_URL;
const OWNER_PHONE = process.env.OWNER_PHONE;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URL);
    console.log("Mango Baza ulandi! ✅🥭🗿");

    const owner = await User.findOne({ role: "owner" });

    if (!owner) {
      await User.create({
        role: "owner",
        firstName: "Ega",
        phone: OWNER_PHONE,
        password: "admin1234",
      });

      console.log("Ega muvaffaqiyatli yaratilindi! ✅");
    }
  } catch (err) {
    console.error("MongoDB ulanmadi ❌🥭🗿", err);
    process.exit(1);
  }
};

module.exports = connectDB;
