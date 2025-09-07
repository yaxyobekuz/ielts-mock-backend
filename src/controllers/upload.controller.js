const { uploadFile, uploadFiles } = require("../services/uploadService");

const uploadPhoto = async (req, res, next) => {
  try {
    const fileUrl = await uploadFile(req.file);
    res.json({ success: true, url: fileUrl });
  } catch (err) {
    next(err);
  }
};

const uploadPhotos = async (req, res, next) => {
  try {
    const urls = await uploadFiles(req.files);
    res.json({ success: true, urls });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadPhoto,
  uploadPhotos,
};
