// Models
const Part = require("./Part");

// Mongoose
const mongoose = require("mongoose");

// Helpers
const { countSectionQuestions } = require("../utils/helpers");

const Answer = new mongoose.Schema({ text: { type: String } });

const Group = new mongoose.Schema({
  answers: [Answer],
  question: { type: String, required: true },
  correctAnswerIndex: { type: Number, required: true },
});

const Option = new mongoose.Schema({
  option: { type: String, required: true },
});

const Section = new mongoose.Schema(
  {
    // Base
    description: { type: String },
    title: { type: String, required: true },
    module: { type: String, required: true },
    partId: { type: String, required: true },
    testId: { type: String, required: true },
    questionsCount: { type: Number, default: 0, required: true },
    type: {
      type: String,
      required: true,
      enum: ["text", "text-draggable", "flowchart", "radio-group"],
    },

    // text & text-draggable
    text: { type: String },
    answers: [Answer],

    // radio-group
    groups: [Group],

    // text-draggable & flowchart
    options: { title: { type: String }, data: [Option] },

    // flowchart
    items: { title: { type: String }, data: [{ text: { type: String } }] },

    // Dropzone & Input coords
    coords: { type: mongoose.Schema.Types.Mixed, default: {} },

    createdBy: {
      ref: "User",
      required: true,
      type: mongoose.Schema.Types.ObjectId,
    },
    supervisor: {
      ref: "User",
      required: true,
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  { timestamps: true }
);

// Helper to update totalQuestions in Part
const updatePartQuestions = async (partId) => {
  const part = await Part.findById(partId).populate("sections");
  if (part) {
    part.totalQuestions = part.sections.reduce(
      (sum, sec) => sum + (sec.questionsCount || 0),
      0
    );
    await part.save();
  }
};

// Before
Section.pre("save", function (next) {
  this.questionsCount = countSectionQuestions(this);
  next();
});

Section.pre(["findOneAndUpdate", "updateOne"], async function (next) {
  const update = this.getUpdate();
  if (!update) return next();

  // Get old document
  const docToUpdate = await this.model.findOne(this.getQuery());
  if (!docToUpdate) return next();

  // Calculate questionsCount if data is being changed
  const toCalc = { ...update, type: update.type || docToUpdate.type };
  update.questionsCount = countSectionQuestions(toCalc);

  this.setUpdate(update);
  next();
});

// After
Section.post("save", async function (doc) {
  if (doc.partId) await updatePartQuestions(doc.partId);
});

Section.post(["findOneAndUpdate", "updateOne"], async function (doc) {
  if (doc?.partId) await updatePartQuestions(doc.partId);
});

Section.post(["findOneAndDelete", "deleteOne"], async function (doc) {
  if (doc?.partId) await updatePartQuestions(doc.partId);
});

module.exports = mongoose.model("Section", Section);
