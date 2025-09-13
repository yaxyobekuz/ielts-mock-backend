// Mongoose
const mongoose = require("mongoose");

// Models
const Link = require("../models/Link");
const Test = require("../models/Test");

// Helpers
const { shuffleArray } = require("../utils/helpers");

const prepareTestForUser = async (testId) => {
  try {
    const test = await Test.findById(testId)
      .populate({
        path: "reading.parts writing.parts listening.parts",
        populate: {
          path: "sections",
          model: "Section",
        },
      })
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
  const createdBy = req.user.id;
  const { mine, testId } = req.query;

  try {
    let links;

    // User links
    if (mine) {
      links = await Link.find({ createdBy, testId })
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
  const { name, phone, age } = req.body;
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
      age,
      name,
      phone,
      userAgent,
    });

    link.usedCount += 1;
    await link.save();

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
  getLinkPreview,
};
