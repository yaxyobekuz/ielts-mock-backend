// Stats jobs
const {
  scheduleStatsUpdate,
  scheduleUserStatsUpdate,
} = require("../jobs/statsJobs");

// Mongoose
const mongoose = require("mongoose");

// Models
const Link = require("../models/Link");
const Test = require("../models/Test");
const User = require("../models/User");

// Helpers
const { shuffleArray, pickAllowedFields } = require("../utils/helpers");

const prepareTestForUser = async (testId) => {
  try {
    const test = await Test.findById(testId)
      .populate({
        path: "reading.parts writing.parts listening.parts",
        populate: { path: "sections", model: "Section" },
      })
      .populate("listening.audios")
      .lean();

    if (!test) return null;

    // Remove test.image
    delete test.image;

    const handleSections = (sections) => {
      return sections.map((sec) => {
        const section = { ...sec };

        // Remove group correct answer index
        if (section.groups?.length) {
          section.groups = section.groups.map((group) => {
            const g = { ...group };
            delete g.correctAnswerIndex;
            return g;
          });
        }

        // Shuffle options.data
        if (section.options?.data?.length) {
          section.options = {
            ...section.options,
            data: shuffleArray(section.options.data),
          };
        }

        // Remove answers
        if (section.answers) delete section.answers;
        return section;
      });
    };

    ["reading", "writing", "listening"].forEach((module) => {
      if (test[module]?.parts?.length) {
        test[module].parts = test[module].parts.map((part) => {
          const p = { ...part };
          if (p.sections?.length) {
            p.sections = handleSections(p.sections);
          }
          return p;
        });
      }
    });

    return test;
  } catch (err) {
    return null;
  }
};

// Create link
const createLink = async (req, res, next) => {
  const { _id: createdBy, supervisor } = req.user;
  const { title, testId, maxUses, requireComment } = req.body;

  try {
    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({
        code: "testNotFound",
        message: "Test topilmadi",
      });
    }

    const link = await Link.create({
      title,
      testId,
      maxUses,
      createdBy,
      requireComment,
      supervisor: supervisor || createdBy,
    });

    // Schedule stats update for teacher and supervisor
    const { _id, role } = req.user;
    const statsUpdate = { "links.created": 1 };
    const userStatsUpdate = { "links.active": 1, "links.created": 1 };

    await scheduleUserStatsUpdate(_id, userStatsUpdate);
    await scheduleStatsUpdate(_id, role, supervisor, statsUpdate);

    // If teacher, update supervisor stats too
    if (role === "teacher" && supervisor) {
      await scheduleUserStatsUpdate(supervisor, userStatsUpdate);
      await scheduleStatsUpdate(supervisor, "supervisor", null, statsUpdate);
    }

    res.status(201).json({
      link,
      code: "linkCreated",
      message: "Havola yaratildi",
    });
  } catch (err) {
    next(err);
  }
};

// Update link
const updateLink = async (req, res, next) => {
  const user = req.user;
  const id = req.params.id;

  // Pick allowed fields
  const allowedFields = ["title", "maxUses", "requireComment"];
  const updates = pickAllowedFields(req.body, allowedFields);

  // Filter
  let filter = { _id: id };
  if (user.role === "teacher") {
    filter.createdBy = user._id;
  } else if (user.role === "supervisor") {
    filter.supervisor = user._id;
  }

  try {
    const link = await Link.findOneAndUpdate(filter, updates, { new: true });
    if (!link) {
      return res.status(404).json({
        code: "linkNotFound",
        message: "Havola topilmadi",
      });
    }

    res.json({
      link,
      updates,
      code: "linkUpdated",
      message: "Havola yangilandi",
    });
  } catch (err) {
    next(err);
  }
};

// Delete link
const deleteLink = async (req, res, next) => {
  const user = req.user;
  const id = req.params.id;

  // Filter
  let filter = { _id: id };
  if (user.role === "teacher") filter.createdBy = user._id;
  else if (user.role === "supervisor") filter.supervisor = user._id;

  try {
    const link = await Link.findOneAndDelete(filter);
    if (!link) {
      return res.status(404).json({
        code: "linkNotFound",
        message: "Havola topilmadi",
      });
    }

    // Schedule stats update for teacher and supervisor
    const { _id, role, supervisor } = req.user;
    const statsUpdate = { "links.deleted": 1 };
    const userStatsUpdate = { "links.active": -1, "links.deleted": 1 };

    await scheduleUserStatsUpdate(_id, userStatsUpdate);
    await scheduleStatsUpdate(_id, role, supervisor, statsUpdate);

    // If teacher, update supervisor stats too
    if (role === "teacher" && supervisor) {
      await scheduleUserStatsUpdate(supervisor, userStatsUpdate);
      await scheduleStatsUpdate(supervisor, "supervisor", null, statsUpdate);
    }

    res.json({
      link,
      code: "linkDeleted",
      message: "Havola o'chirildi",
    });
  } catch (err) {
    next(err);
  }
};

// Get link
const getLink = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user._id;
  const userRole = req.user.role;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        code: "invalidId",
        message: "Havola ID yaroqsiz",
      });
    }

    const link = await Link.findById(id)
      .populate({
        path: "createdBy",
        populate: "avatar",
        select: "firstName lastName avatar phone role",
      })
      .select("-__v")
      .lean();

    if (!link) {
      return res.status(404).json({
        code: "linkNotFound",
        message: "Havola topilmadi",
      });
    }

    // Check permissions
    const supervisorId = link.supervisor?.toString();
    const createdById = link.createdBy?._id?.toString();

    if (userRole === "teacher") {
      if (userId.toString() !== createdById) {
        return res.status(403).json({
          code: "forbidden",
          message: "Sizda bu havolani ko'rish huquqi yo'q",
        });
      }
    } else if (userRole === "supervisor") {
      if (
        userId.toString() !== supervisorId &&
        userId.toString() !== createdById
      ) {
        return res.status(403).json({
          code: "forbidden",
          message: "Sizda bu havolani ko'rish huquqi yo'q",
        });
      }
    }

    res.json({
      link,
      code: "linkFetched",
      message: "Havola olindi",
    });
  } catch (err) {
    next(err);
  }
};

// Get links
const getLinks = async (req, res, next) => {
  const userId = req.user._id;
  const userRole = req.user.role;
  const testId = req.query.testId;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search?.trim() || "";

  try {
    const filter = {};
    const skip = (page - 1) * limit;

    // Role-based filtering
    if (userRole === "teacher") {
      filter.createdBy = userId;
    } else if (userRole === "supervisor") {
      filter.supervisor = userId;
    }

    // Filter by testId
    if (testId && mongoose.Types.ObjectId.isValid(testId)) {
      filter.testId = testId;
    }

    // Search by title
    if (search) {
      filter.title = { $regex: search, $options: "i" };
    }

    const [links, total] = await Promise.all([
      Link.find(filter)
        .populate({
          path: "createdBy",
          populate: "avatar",
          select: "firstName lastName avatar role",
        })
        .sort({ createdAt: -1 })
        .select("-__v -visits -usages")
        .skip(skip)
        .limit(limit)
        .lean(),
      Link.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      links,
      code: "linksFetched",
      message: "Havolalar topildi",
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Get link preview
const getLinkPreview = async (req, res, next) => {
  const ip = req.ip;
  const { id } = req.params;
  const userId = req.user._id;
  const userAgent = req.headers["user-agent"];

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        code: "invalidId",
        message: "Havola yaroqsiz",
      });
    }

    const link = await Link.findById(id);
    if (!link) {
      return res.status(404).json({
        code: "linkInvalid",
        message: "Havola yaroqsiz",
      });
    }

    link.visits.push({ userAgent, ip, userId });
    link.visitsCount = link.visitsCount + 1;
    await link.save();

    // Schedule stats update for link visits
    const teacherId = link.createdBy;
    const supervisorId = link.supervisor;
    const User = require("../models/User");
    const teacher = await User.findById(teacherId).select("role");

    if (teacher) {
      const userStatsUpdate = { "links.totalVisits": 1 };
      const statsUpdate = { "links.totalVisits": 1 };

      await scheduleUserStatsUpdate(teacherId, userStatsUpdate);
      await scheduleStatsUpdate(
        teacherId,
        teacher.role,
        supervisorId,
        statsUpdate
      );

      // If teacher, update supervisor stats too
      if (teacher.role === "teacher" && supervisorId) {
        await scheduleUserStatsUpdate(supervisorId, userStatsUpdate);
        await scheduleStatsUpdate(
          supervisorId,
          "supervisor",
          null,
          statsUpdate
        );
      }
    }

    const isAvailable = link.usedCount < link.maxUses;

    res.json({
      code: "linkFound",
      message: "Havola topildi",
      link: {
        title: link.title,
        testId: link.testId,
        available: isAvailable,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Add usage
const addUsage = async (req, res, next) => {
  const ip = req.ip;
  const { id } = req.params;
  const userId = req.user._id;
  const userAgent = req.headers["user-agent"];

  try {
    const link = await Link.findById(id);
    if (!link) {
      return res.status(404).json({
        code: "linkNotFound",
        message: "Havola topilmadi",
      });
    }

    if (link.usedCount >= link.maxUses) {
      return res.status(400).json({
        code: "maxUsesReached",
        message: "Foydalanish limiti tugagan",
      });
    }

    link.usedCount += 1;
    link.usages.push({ ip, userId, userAgent });
    await link.save();

    // Schedule stats update for link usage
    const teacherId = link.createdBy;
    const supervisorId = link.supervisor;
    const teacher = await User.findById(teacherId).select("role");

    if (teacher) {
      const statsUpdate = { "links.totalUsages": 1 };
      const userStatsUpdate = { "links.totalUsages": 1 };

      await scheduleUserStatsUpdate(teacherId, userStatsUpdate);
      await scheduleStatsUpdate(
        teacherId,
        teacher.role,
        supervisorId,
        statsUpdate
      );

      // If teacher, update supervisor stats too
      if (teacher.role === "teacher" && supervisorId) {
        await scheduleUserStatsUpdate(supervisorId, userStatsUpdate);
        await scheduleStatsUpdate(
          supervisorId,
          "supervisor",
          null,
          statsUpdate
        );
      }
    }

    const test = await prepareTestForUser(link.testId);

    res.json({
      test,
      code: "usageAdded",
      message: "Foydalanish qo'shildi",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getLink,
  addUsage,
  getLinks,
  createLink,
  updateLink,
  deleteLink,
  getLinkPreview,
};
