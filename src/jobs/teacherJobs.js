const agenda = require("../config/agenda");
const { transferTeacherContent } = require("../services/teacherCleanup");

/**
 * Job to transfer teacher's content to supervisor when teacher is deleted
 */
agenda.define("transfer-teacher-content", async (job) => {
  const { teacherId, supervisorId } = job.attrs.data;

  try {
    console.log(
      `📋 Job boshlandi: transfer-teacher-content (${teacherId} -> ${supervisorId})`
    );

    const result = await transferTeacherContent(teacherId, supervisorId);

    console.log(`✅ Job muvaffaqiyatli yakunlandi:`, result.summary);
  } catch (error) {
    console.error(`❌ Job'da xatolik yuz berdi:`, error);
    throw error;
  }
});

/**
 * Function to schedule the job
 */
const scheduleTeacherContentTransfer = async (teacherId, supervisorId) => {
  try {
    // Darhol background'da ishga tushirish
    await agenda.now("transfer-teacher-content", {
      teacherId: teacherId.toString(),
      supervisorId: supervisorId.toString(),
    });

    console.log(
      `✅ Transfer job navbatga qo'shildi: ${teacherId} -> ${supervisorId}`
    );
  } catch (error) {
    console.error("❌ Job'ni navbatga qo'shishda xatolik:", error);
    throw error;
  }
};

module.exports = {
  scheduleTeacherContentTransfer,
};
