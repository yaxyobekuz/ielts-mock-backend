// Stats jobs
const {
  scheduleStatsUpdate,
  scheduleUserStatsUpdate,
} = require("../jobs/statsJobs");

// Models
const Part = require("../models/Part");
const Test = require("../models/Test");
const Section = require("../models/Section");
const Template = require("../models/Template");

// Services
const { uploadFiles, uploadFile } = require("../services/uploadService");

// Create template
const createTemplate = async (req, res, next) => {
  const images = req.files.images;
  const banner = req.files.banner?.[0];
  const { _id: userId, role: userRole, supervisor } = req.user;
  const { title, description, testId, type } = req.body;

  if (
    !images?.length ||
    !title?.trim()?.length ||
    !description?.trim()?.length
  ) {
    return res.status(400).json({
      code: "invalidProperty",
      message: "Sarlavha, izoh va kamida bitta rasm talab qilinadi",
    });
  }

  if (!type) {
    return res.status(400).json({
      code: "invalidType",
      message: "Tur talab qilinadi",
    });
  }

  try {
    // Test Filter
    let filter = { _id: testId };
    if (userRole === "supervisor") filter.supervisor = userId;
    else if (userRole === "teacher") filter.createdBy = userId;

    // Find Test
    const test = await Test.findOne(filter);
    if (!test) {
      return res.status(404).json({
        code: "testNotFound",
        message: "Test topilmadi",
      });
    }

    if (test.isTemplate) {
      return res.status(400).json({
        code: "testAlreadyTemplate",
        message: "Test allaqachon shablon sifatida belgilangan",
      });
    }

    // Upload images & banner
    const uploadedImages = await uploadFiles(images, userId);
    let uploadedBanner = null;
    if (banner) uploadedBanner = await uploadFile(banner, userId);

    // Create template
    const template = await Template.create({
      type,
      title,
      description,
      test: testId,
      createdBy: userId,
      banner: uploadedBanner,
      images: uploadedImages.map((img) => img._id),
    });

    // Update test
    test.isTemplate = true;
    test.template = template._id;
    await test.save();

    // Assign images
    const formattedTemplate = { ...template.toObject() };
    formattedTemplate.images = uploadedImages;

    // Schedule stats update for teacher and supervisor
    const statsUpdate = { "templates.created": 1 };
    const userStatsUpdate = { "templates.active": 1, "templates.created": 1 };

    await scheduleUserStatsUpdate(userId, userStatsUpdate);
    await scheduleStatsUpdate(userId, userRole, test.supervisor, statsUpdate);

    // If teacher, update supervisor stats too
    if (userRole === "teacher" && test.supervisor) {
      await scheduleUserStatsUpdate(test.supervisor, userStatsUpdate);
      await scheduleStatsUpdate(
        test.supervisor,
        "supervisor",
        null,
        statsUpdate
      );
    }

    res.status(201).json({
      code: "templateCreated",
      template: formattedTemplate,
      message: "Shablon yaratildi",
    });
  } catch (err) {
    next(err);
  }
};

// Get templates
const getTemplates = async (req, res, next) => {
  // Pagination
  const type = req.query.type;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  try {
    const filter = {
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    };

    // Add type filter if provided
    if (type && type !== "all") filter.type = type;

    const [templates, total] = await Promise.all([
      Template.find(filter)
        .populate("banner")
        .sort({ createdAt: -1 })
        .select("-__v -images -createdBy")
        .skip(skip)
        .limit(limit),
      Template.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      templates,
      code: "templatesFetched",
      message: "Shablonlar olindi",
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

// Get single template by ID
const getTemplateById = async (req, res, next) => {
  const { id } = req.params;
  const { random } = req.query;

  try {
    const template = await Template.findOne({
      _id: id,
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    })
      .populate("images")
      .sort({ createdAt: -1 })
      .select("-__v -banner -createdBy");

    if (!template) {
      return res
        .status(404)
        .json({ code: "templateNotFound", message: "Shablon topilmadi" });
    }

    let extraTemplates = [];

    // Get extra random templates
    if (random === "true") {
      extraTemplates = await Template.aggregate([
        {
          $match: {
            $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
          },
        },
        { $sample: { size: 4 } },
        {
          $lookup: {
            as: "banner",
            from: "images",
            foreignField: "_id",
            localField: "banner",
          },
        },
        { $unwind: { path: "$banner", preserveNullAndEmptyArrays: true } },
        { $project: { __v: 0, images: 0, createdBy: 0 } },
      ]);
    }

    res.json({
      template,
      extraTemplates,
      code: "templateFetched",
      message: "Shablon muvaffaqiyatli olindi",
    });
  } catch (err) {
    next(err);
  }
};

// Update template
const updateTemplate = async (req, res, next) => {
  const updates = {};
  const { id } = req.params;
  const { _id: createdBy, role } = req.user;
  const allowedFields = ["title", "description", "image"];

  try {
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (!updates?.title || !updates.title.trim().length) {
      return res.status(400).json({
        code: "invalidProperty",
        message: "Template sarlavhasi talab qilinadi",
      });
    }

    const updated = await Template.findOneAndUpdate(
      { _id: id, createdBy },
      updates,
      { new: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ code: "templateNotFound", message: "Template topilmadi" });
    }

    res.json({
      template: updated,
      code: "templateUpdated",
      message: "Template muvaffaqiyatli yangilandi",
    });
  } catch (err) {
    next(err);
  }
};

// Delete template
const deleteTemplate = async (req, res, next) => {
  const { id } = req.params;
  const { _id, role, supervisor } = req.user;

  try {
    const deleted = await Template.findOneAndDelete({ _id: id, createdBy: _id });

    if (!deleted) {
      return res.status(404).json({
        code: "templateNotFound",
        message: "Template topilmadi",
      });
    }

    // Schedule stats update for teacher and supervisor
    const statsUpdate = { "templates.deleted": 1 };
    const userStatsUpdate = { "templates.active": -1, "templates.deleted": 1 };

    await scheduleUserStatsUpdate(_id, userStatsUpdate);
    await scheduleStatsUpdate(_id, role, supervisor, statsUpdate);

    // If teacher, update supervisor stats too
    if (role === "teacher" && supervisor) {
      await scheduleUserStatsUpdate(supervisor, userStatsUpdate);
      await scheduleStatsUpdate(supervisor, "supervisor", null, statsUpdate);
    }

    res.json({
      code: "templateDeleted",
      message: "Template muvaffaqiyatli o'chirildi",
    });
  } catch (err) {
    next(err);
  }
};

// Use template
const useTemplate = async (req, res, next) => {
  const { id } = req.params;
  const { title, image = "" } = req.body;
  const { _id: createdBy, supervisor } = req.user;

  if (!title || !title.trim().length) {
    return res.status(400).json({
      code: "invalidProperty",
      message: "Test sarlavhasi talab qilinadi",
    });
  }

  try {
    // Template
    const template = await Template.findOne({
      _id: id,
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    });
    if (!template) {
      return res.status(404).json({
        code: "templateNotFound",
        message: "Shablon topilmadi",
      });
    }

    // Test
    const originalTest = await Test.findById(template.test).populate({
      path: "reading.parts writing.parts listening.parts",
      populate: { path: "sections", model: "Section" },
    });
    if (!originalTest) {
      return res.status(404).json({
        code: "testNotFound",
        message: "Test topilmadi",
      });
    }

    // New test
    const newTest = new Test({
      title,
      createdBy,
      supervisor,
      isTemplated: true,
      template: template._id,
      templatedBy: createdBy,
      originalTest: originalTest._id,
      image: image || originalTest.image,
      totalParts: originalTest.totalParts,
      description: originalTest.description,
      writing: { partsCount: 0, parts: [] },
      reading: { partsCount: 0, parts: [] },
      listening: { partsCount: 0, parts: [] },
    });

    // Clone helpers
    const cloneSections = async (sections = []) => {
      const newSections = await Promise.all(
        sections.map(async (section) => {
          if (!section) return null;
          const sectionObj = { ...section.toObject() };
          delete sectionObj._id;
          delete sectionObj.createdAt;
          delete sectionObj.updatedAt;

          sectionObj.testId = newTest._id;
          sectionObj.createdBy = createdBy;
          sectionObj.supervisor = supervisor;

          const newSection = await Section.create(sectionObj);
          return newSection._id;
        })
      );

      return newSections.filter(Boolean);
    };

    const cloneParts = async (parts = []) => {
      const newParts = await Promise.all(
        parts.map(async (part) => {
          if (!part) return null;
          const partObj = { ...part.toObject() };
          const sections = await cloneSections(partObj.sections);

          delete partObj._id;
          delete partObj.createdAt;
          delete partObj.updatedAt;

          partObj.sections = sections;
          partObj.testId = newTest._id;
          partObj.createdBy = createdBy;
          partObj.supervisor = supervisor;

          const newPart = await Part.create(partObj);
          return newPart._id;
        })
      );

      return newParts.filter(Boolean);
    };

    // Clone all parts
    const [readingParts, writingParts, listeningParts] = await Promise.all([
      cloneParts(originalTest.reading.parts),
      cloneParts(originalTest.writing.parts),
      cloneParts(originalTest.listening.parts),
    ]);

    // Assign parts
    newTest.reading.parts = readingParts;
    newTest.reading.partsCount = readingParts.length;

    newTest.writing.parts = writingParts;
    newTest.writing.partsCount = writingParts.length;

    newTest.listening.parts = listeningParts;
    newTest.listening.partsCount = listeningParts.length;

    // Save
    const savedTest = await newTest.save();
    originalTest.copyCount = (originalTest.copyCount || 0) + 1;
    await originalTest.save();

    // Test for user response
    const testForUser = {};
    testForUser._id = savedTest._id;
    testForUser.title = savedTest.title;
    testForUser.isCopied = savedTest.isCopied;
    testForUser.createdAt = savedTest.createdAt;
    testForUser.totalParts = savedTest.totalParts;
    testForUser.isTemplate = savedTest.isTemplate;
    testForUser.isTemplated = savedTest.isTemplated;
    testForUser.description = savedTest.description;
    testForUser.totalSubmissions = savedTest.totalSubmissions;

    testForUser.createdBy = {};
    testForUser.createdBy.id = createdBy;
    testForUser.createdBy.lastName = req.user.lastName;
    testForUser.createdBy.firstName = req.user.firstName;

    res.status(201).json({
      test: testForUser,
      code: "templateUsed",
      message: "Yangi test shablondan nusxa olindi",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  useTemplate,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplateById,
};
