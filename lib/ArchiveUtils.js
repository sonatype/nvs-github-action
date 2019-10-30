"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path_1 = __importDefault(require("path"));
const Archiver = require("archiver");
class ArchiveUtils {
    static async zipFiles(files) {
        return new Promise((resolve, reject) => {
            if (files === undefined || files.length === 0) {
                reject(new Error('no files to zip'));
            }
            const zipFile = __dirname + '/dataToScan.zip';
            const zipOut = fs.createWriteStream(zipFile);
            const archive = Archiver('zip', {
                zlib: { level: 9 }
            });
            archive.pipe(zipOut);
            for (const file of files) {
                archive.append(fs.createReadStream(file), { name: path_1.default.basename(file) });
            }
            archive.on('error', function (err) {
                reject(err);
            });
            zipOut.on('close', function () {
                console.log(`${zipFile} has been created with ${archive.pointer()} total bytes`);
                resolve(zipFile);
            });
            archive.finalize();
        });
    }
}
exports.ArchiveUtils = ArchiveUtils;
