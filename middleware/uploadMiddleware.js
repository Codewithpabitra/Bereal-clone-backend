const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Post image storage
const postStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "candid/posts",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 1080, height: 1080, crop: "limit" }, // max 1080x1080
      { quality: "auto" },                           // auto compress
      { fetch_format: "auto" },                      // auto format (webp if supported)
    ],
  },
});

// Avatar image storage
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "candid/avatars",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 400, height: 400, crop: "fill", gravity: "face" }, // face-crop for avatars
      { quality: "auto" },
      { fetch_format: "auto" },
    ],
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// Two separate upload middlewares
const uploadPost = multer({ storage: postStorage, fileFilter });
const uploadAvatar = multer({ storage: avatarStorage, fileFilter });

module.exports = { uploadPost, uploadAvatar };