import express from "express"
import multer from "multer"
import dotenv from "dotenv"
import fs from "fs"
import path from "path"
import checkDiskSpace from "check-disk-space"

dotenv.config()
const app = express()
const PORT = process.env.PORT || 3000;

let Total_Space, Used_Space, Remaining_Space;

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null,`./storage`)
    },
    filename: function(req, file, cb){
        ext = `.mp4`
        cb(null,`file-${Date.now()}.${ext}`)
    }
})

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

function size(bytes){
    if(bytes <= 1024){
        return `${bytes} By`
    }
    else if(bytes >= 1024 && bytes < (1024 * 1024)){
        return `${(bytes/1024).toFixed(2)} Kb`
    }
    else if(bytes >= (1024 * 1024) && bytes < (1024 * 1024 * 1024)){
        return `${(bytes/(1024*1024)).toFixed(2)} Mb`
    }
    else if(bytes >= (1024 * 1024 * 1024)){
        return `${(bytes/(1024 * 1024 * 1024)).toFixed(2)} Gb`
    }
}

getSpaceInfo('./storage').then(info => {
    Total_Space = size(info.totalSpace)
    Used_Space = size(info.usedSpace)
    Remaining_Space = size(info.remainingSpace)
}).catch(console.error);

const upload = multer({storage: storage}).single(`file`)

app.get(`/`,upload,(req,res)=>{
    res.json({Total_Space, Used_Space, Remaining_Space})
})

app.listen(PORT,()=>{
    console.log(`server runs on ${PORT}`);
})