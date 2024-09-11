import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import checkDiskSpace from "check-disk-space";

dotenv.config();
const app = express();

// Ensure the 'storage' folder exists
const storageDirectory = './storage';
if (!fs.existsSync(storageDirectory)) {
    fs.mkdirSync(storageDirectory);
    console.log(`Created directory: ${storageDirectory}`);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, storageDirectory);  // Use the 'storage' directory
    },
    filename: function (req, file, cb) {
        const ext = file.originalname.split(`.`).pop();  // Use a valid extension
        cb(null, `file-${Date.now()}.${ext}`);
    }
});

// Helper function to get folder size
function getFolderSize(directory) {
    let totalSize = 0;

    const files = fs.readdirSync(directory);
    files.forEach(file => {
        const filePath = path.join(directory, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
            totalSize += getFolderSize(filePath);
        } else {
            totalSize += stats.size;
        }
    });

    return totalSize;
}

// Get space info (total, used, and remaining)
async function getSpaceInfo(directory) {
    const diskSpace = await checkDiskSpace(path.resolve(directory));
    const folderSize = getFolderSize(directory);
    const usedSpace = diskSpace.size - diskSpace.free + folderSize;

    return {
        totalSpace: diskSpace.size,
        usedSpace: usedSpace,
        remainingSpace: diskSpace.free - folderSize
    };
}

// Check space for './storage' folder
getSpaceInfo(storageDirectory).then(info => {
    console.log(`Total Space: ${info.totalSpace} bytes`);
    console.log(`Used Space: ${info.usedSpace} bytes`);
    console.log(`Remaining Space: ${info.remainingSpace} bytes`);
}).catch(console.error);

// Multer setup
const upload = multer({ storage: storage }).single('file');

app.get('/', (req, res) => {
    res.json({ Message: 'Welcome' });
});

app.post('/upload', upload, (req, res) => {
    if(req.file){
        res.send(`File uploadded`)
        console.log(req.file)
    }
});

app.listen(3000, () => {
    console.log('Server runs on port 3000');
});
