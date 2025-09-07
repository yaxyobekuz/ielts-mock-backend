// S3 config
const s3 = require("../config/s3");

// Aws
const { PutObjectCommand } = require("@aws-sdk/client-s3");

const uploadFile = async (file, folder = "photos") => {
  const params = {
    Body: file.buffer,
    ACL: "public-read",
    ContentType: file.mimetype,
    Bucket: process.env.DO_SPACES_BUCKET,
    Key: `${folder}/${Date.now()}-${file.originalname}`,
  };

  await s3.send(new PutObjectCommand(params));

  return `${process.env.DO_SPACES_ENDPOINT}/${process.env.DO_SPACES_BUCKET}/${params.Key}`;
};

const uploadFiles = async (files, folder = "photos") => {
  return Promise.all(files.map((file) => uploadFile(file, folder)));
};

module.exports = {
  uploadFile,
  uploadFiles,
};
