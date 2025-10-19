// Models
const Test = require("../models/Test");
const Part = require("../models/Part");
const Link = require("../models/Link");
const Audio = require("../models/Audio");
const Image = require("../models/Image");
const Result = require("../models/Result");
const Section = require("../models/Section");
const Template = require("../models/Template");

/**
 * Transfer all content created by deleted teacher to supervisor
 * @param {String} teacherId - Deleted teacher's ID
 * @param {String} supervisorId - Supervisor's ID
 */
const transferTeacherContent = async (teacherId, supervisorId) => {
  try {
    console.log(
      `🔄 Ustoz kontentlarini o'tkazish boshlandi: ${teacherId} -> ${supervisorId}`
    );

    const filter = { createdBy: teacherId };
    const update = { createdBy: supervisorId };

    // Barcha modellarni yangilash
    const [
      testsResult,
      partsResult,
      linksResult,
      audiosResult,
      imagesResult,
      resultsResult,
      sectionsResult,
      templatesResult,
    ] = await Promise.all([
      Test.updateMany(filter, update),
      Part.updateMany(filter, update),
      Link.updateMany(filter, update),
      Audio.updateMany(filter, update),
      Image.updateMany(filter, update),
      Result.updateMany(filter, update),
      Section.updateMany(filter, update),
      Template.updateMany(filter, update),
    ]);

    const summary = {
      tests: testsResult.modifiedCount,
      parts: partsResult.modifiedCount,
      links: linksResult.modifiedCount,
      audios: audiosResult.modifiedCount,
      images: imagesResult.modifiedCount,
      results: resultsResult.modifiedCount,
      sections: sectionsResult.modifiedCount,
      templates: templatesResult.modifiedCount,
    };

    console.log(
      `✅ Ustoz kontentlari muvaffaqiyatli o'tkazildi:`,
      JSON.stringify(summary, null, 2)
    );

    return {
      summary,
      teacherId,
      supervisorId,
      success: true,
    };
  } catch (error) {
    console.error("❌ Ustoz kontentlarini o'tkazishda xatolik:", error);
    throw error;
  }
};

module.exports = {
  transferTeacherContent,
};
