const multer = require('multer');
const path = require('path');

// Set storage config
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads'); // Uploads go here
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Unique filename with extension
    }
});

const upload = multer({ storage: storage });

module.exports = upload;
