const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { MAX_IMAGE_BYTES } = require("../config/recipeConstants");

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads", "recipes");

const ensureUploadDir = () => {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
};

const imageFsPath = (imagePath) => {
  if (!imagePath) {
    return null;
  }
  const filename = path.basename(imagePath);
  return path.join(UPLOAD_DIR, filename);
};

const deleteImageFile = (imagePath) => {
  const filePath = imageFsPath(imagePath);
  if (!filePath) {
    return;
  }
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadDir();
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = file.mimetype === "image/png" ? ".png" : ".jpg";
    cb(null, `${req.params.id}-${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      cb(null, true);
      return;
    }
    const err = new Error("Image must be a JPEG or PNG.");
    err.statusCode = 400;
    cb(err);
  },
});

const handleImageUpload = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (!err) {
      next();
      return;
    }
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).send({
        message: "Image must be 2 MB or smaller.",
      });
    }
    return res.status(400).send({
      message: err.message || "Image must be a JPEG or PNG.",
    });
  });
};

const publicImagePath = (filename) =>
  `/recipeapi/uploads/recipes/${filename}`;

module.exports = {
  UPLOAD_DIR,
  ensureUploadDir,
  deleteImageFile,
  handleImageUpload,
  publicImagePath,
};
