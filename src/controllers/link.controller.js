const Link = require("../models/Link");
const Test = require("../models/Test");

// Create link
const createLink = async (req, res, next) => {
  const createdBy = req.user.id;
  const { title, testId, maxUses } = req.body;

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
    });

    res.status(201).json({
      link,
      code: "linkCreated",
      message: "Havola yaratildi",
    });
  } catch (err) {
    next(err);
  }
};

// Get link
const getLink = async (req, res, next) => {
  const { id } = req.params;

  try {
    const link = await Link.findById(id);
    if (!link) {
      return res.status(404).json({
        code: "linkNotFound",
        message: "Havola topilmadi",
      });
    }

    res.json({
      link,
      code: "linkFound",
      message: "Havola topildi",
    });
  } catch (err) {
    next(err);
  }
};

// Get links
const getLinks = async (req, res, next) => {
  const { mine } = req.query;
  const createdBy = req.user.id;

  try {
    let links;

    // User links
    if (mine) {
      links = await Link.find({ createdBy })
        .select("-__v -usages -visits")
        .sort({ createdAt: -1 });
    }

    // All links
    else {
      links = await Link.find()
        .populate("createdBy", "firstName lastName role avatar")
        .select("-__v -usages -visits")
        .sort({ createdAt: -1 });
    }

    res.json({
      links,
      code: "linksFetched",
      message: "Havolalar muvaffaqiyatli olindi",
    });
  } catch (err) {
    next(err);
  }
};

// Get link preview
const getLinkPreview = async (req, res, next) => {
  const ip = req.ip;
  const { id } = req.params;
  const userAgent = req.headers["user-agent"];

  try {
    const link = await Link.findById(id);
    if (!link) {
      return res.status(404).json({
        code: "linkInvalid",
        message: "Ushbu havola yaroqsiz",
      });
    }

    link.visits.push({ userAgent, ip });
    link.visitsCount = link.visitsCount + 1;
    await link.save();

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
  const { name, phone, extra } = req.body;
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

    link.usages.push({
      ip,
      name,
      phone,
      extra,
      userAgent,
    });

    link.usedCount += 1;
    await link.save();

    res.json({
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
  getLinkPreview,
};
