// Models
const User = require("../models/User");

// Helpers
const { getRandomNumber, extractNumbers } = require("../utils/helpers");

// Jobs
const { scheduleTeacherContentTransfer } = require("../jobs/teacherJobs");

// Create teacher
const createTeacher = async (req, res, next) => {
  const supervisorId = req.user._id;
  const { phone, password } = req.body;

  const formattedPassword = password?.trim() || "";
  const formattedPhone = extractNumbers(phone) || "";

  if (formattedPhone.length !== 12) {
    return res.status(400).json({
      code: "invalidPhone",
      message: "Telefon raqam noto'g'ri",
    });
  }

  if (formattedPassword.length < 4) {
    return res.status(400).json({
      code: "veryShortPassword",
      message: "Parol juda ham qisqa",
    });
  }

  try {
    // If teacher exists
    let teacher = await User.findOne({ phone });
    if (teacher && teacher.supervisor === supervisorId) {
      return res.status(400).json({
        code: "teacherAlreadyCreated",
        message: "Ustoz allaqachon qo'shilgan",
      });
    }

    // If teacher exists
    if (teacher) {
      return res.status(400).json({
        code: "phoneAlreadyUsed",
        message: "Telefon raqam allaqachon ishlatilgan",
      });
    }

    // If teacher does not exist, create new one
    teacher = await User.create({
      role: "teacher",
      firstName: "Ustoz",
      supervisor: supervisorId,
      password: formattedPassword,
      phone: Number(formattedPhone),
      lastName: `#${getRandomNumber(0, 99)}`,
    });

    res.status(201).json({
      teacher,
      code: "teacherCreated",
      message: "Yangi ustoz yaratildi",
    });
  } catch (err) {
    next(err);
  }
};

// Get teachers
const getTeachers = async (req, res, next) => {
  const { _id: supervisorId, role: userRole } = req.user;

  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  try {
    let filter = {};
    if (userRole === "supervisor") filter.supervisor = supervisorId;

    const [teachers, total] = await Promise.all([
      User.find(filter)
        .populate("avatar")
        .select("-__v -password -balance -chatId")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      teachers,
      code: "teachersFetched",
      message: "Ustozlar olindi",
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Get single teacher by ID
const getTeacherById = async (req, res, next) => {
  const { id } = req.params;
  const { _id: userId, role: userRole } = req.user;

  // Filter
  let filter = { _id: id };
  if (userRole === "supervisor") filter.supervisor = userId;

  try {
    const teacher = await User.findOne(filter)
      .populate("avatar")
      .select("-__v -password -balance -chatId -updatedAt");

    if (!teacher) {
      return res.status(404).json({
        code: "teacherNotFound",
        message: "Ustoz topilmadi",
      });
    }

    res.json({
      teacher,
      code: "teacherFetched",
      message: "Ustoz olindi",
    });
  } catch (err) {
    next(err);
  }
};

// Update teacher
const updateTeacher = async (req, res, next) => {
  const updates = {};
  const { id } = req.params;
  const createdBy = req.user.id;
  const allowedFields = ["title", "description", "image"];

  try {
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (!updates?.title || !updates.title.trim().length) {
      return res.status(400).json({
        code: "invalidProperty",
        message: "Teacher sarlavhasi talab qilinadi",
      });
    }

    const updated = await User.findOneAndUpdate(
      { _id: id, createdBy },
      updates,
      { new: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ code: "teacherNotFound", message: "Teacher topilmadi" });
    }

    res.json({
      teacher: updated,
      code: "teacherUpdated",
      message: "Teacher yangilandi",
    });
  } catch (err) {
    next(err);
  }
};

// Update teacher
const deleteTeacher = async (req, res, next) => {
  const { id } = req.params;
  const supervisorId = req.user.id;

  try {
    const deleted = await User.findOneAndDelete({
      _id: id,
      supervisor: supervisorId,
    }).select("-password -chatId -__v");

    if (!deleted) {
      return res.status(404).json({
        code: "teacherNotFound",
        message: "Ustoz topilmadi",
      });
    }

    await scheduleTeacherContentTransfer(id, supervisorId);

    res.json({
      teacher: deleted,
      code: "teacherDeleted",
      message: "Ustoz o'chirildi",
    });
  } catch (err) {
    next(err);
  }
};

// Update user permissions
const updateTeacherPermissions = async (req, res, next) => {
  const userId = req.user._id;
  const permissions = req.body;
  const teacherId = req.params.id;

  try {
    const teacher = await User.findOneAndUpdate(
      { _id: teacherId, supervisor: userId, role: "teacher" },
      { permissions },
      { new: true }
    );

    if (!teacher) {
      return res.status(404).json({
        code: "teacherNotFound",
        message: "Ustoz topilmadi",
      });
    }

    res.json({
      permissions: teacher.permissions,
      code: "teacherPermissionsUpdated",
      message: "Ustoz ruxsatlari yangilandi",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  getTeacherById,
  updateTeacherPermissions,
};
