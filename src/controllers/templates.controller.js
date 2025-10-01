// Models
const Part = require("../models/Part");
const Template = require("../models/Template");

// Create template
const createTemplate = async (req, res, next) => {
  const { _id: createdBy, supervisor } = req.user;
  const { title, description = "", image = "" } = req.body;

  if (!title || !title.trim().length) {
    return res.status(400).json({
      code: "invalidProperty",
      message: "Template sarlavhasi talab qilinadi",
    });
  }

  try {
    const template = await Template.create({
      title,
      image,
      createdBy,
      description,
      supervisor: supervisor || createdBy,
    });

    const getPartData = (module) => ({
      module,
      number: 1,
      createdBy,
      partsCount: 1,
      templateId: template._id,
      totalQuestions: 0,
      supervisor: supervisor || createdBy,
    });

    // Create parts
    const writingPart = await Part.create(getPartData("writing"));
    const readingPart = await Part.create(getPartData("reading"));
    const listeningPart = await Part.create(getPartData("listening"));

    // Save template
    template.totalParts = 3;
    template.reading = { partsCount: 1, parts: [readingPart._id] };
    template.writing = { partsCount: 1, parts: [writingPart._id] };
    template.listening = { partsCount: 1, parts: [listeningPart._id] };
    const savedTemplate = await template.save();

    res.status(201).json({
      code: "templateCreated",
      message: "Yangi template muvaffaqiyatli yaratildi",
      template: {
        ...savedTemplate.toObject(),
        reading: [readingPart],
        writing: [writingPart],
        listening: [listeningPart],
      },
    });
  } catch (err) {
    next(err);
  }
};

// Get templates
const getTemplates = async (req, res, next) => {
  try {
    const templates = await Template.find()
      .populate("banner")
      .sort({ createdAt: -1 })
      .select("-__v -images -createdBy");

    res.json({
      templates,
      code: "templatesFetched",
      message: "Shablonlar muvaffaqiyatli olindi",
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
    const template = await Template.findById(id)
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
        { $match: { _id: { $ne: template._id } } },
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
  const createdBy = req.user.id;
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
  const createdBy = req.user.id;

  try {
    const deleted = await Template.findOneAndDelete({ _id: id, createdBy });

    if (!deleted) {
      return res.status(404).json({
        code: "templateNotFound",
        message: "Template topilmadi",
      });
    }

    res.json({
      code: "templateDeleted",
      message: "Template muvaffaqiyatli o'chirildi",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getTemplateById,
};
