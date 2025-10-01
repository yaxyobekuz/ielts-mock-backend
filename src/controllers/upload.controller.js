const { uploadFile, uploadFiles } = require("../services/uploadService");

const uploadImage = async (req, res, next) => {
  const userId = req.user._id;

  try {
    const image = await uploadFile(req.file, userId);
    res.json({ code: "imageUploaded", image });
  } catch (err) {
    next(err);
  }
};

const uploadImages = async (req, res, next) => {
  const userId = req.user._id;

  try {
    const images = await uploadFiles(req.files, userId);
    res.json({ code: "imagesUploaded", images });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadImage, uploadImages };
