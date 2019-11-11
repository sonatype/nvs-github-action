"use strict";
/*
 * Copyright (c) 2019-present Sonatype, Inc. All rights reserved.
 * Includes the third-party code listed at http://links.sonatype.com/products/nexus/attributions.
 * "Sonatype" is a trademark of Sonatype, Inc.
 */
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
const path = __importStar(require("path"));
const fs = __importStar(require("graceful-fs"));
const Archiver = require("archiver");
const config_json_1 = __importDefault(require("./config.json"));
const loggingUtils_1 = __importDefault(require("./loggingUtils"));
class ArchiveUtils {
    static async zipFiles(files) {
        return new Promise((resolve, reject) => {
            if (files === undefined || files.length === 0) {
                reject(new Error('no files to zip'));
                return;
            }
            const zipFile = path.join(__dirname, config_json_1.default.uploadService.zipFileName);
            const zipOut = fs.createWriteStream(zipFile);
            const archive = Archiver('zip', {
                zlib: { level: 9 }
            });
            archive.pipe(zipOut);
            for (const file of files) {
                archive.append(fs.createReadStream(file), { name: file });
            }
            archive.on('error', (err) => {
                reject(err);
                return;
            });
            archive.on('warning', function (err) {
                loggingUtils_1.default.logError(err.message);
                if (err.code === 'ENOENT') {
                    reject(err);
                    return;
                }
                else {
                    resolve(zipFile);
                    return;
                }
            });
            zipOut.on('close', () => {
                loggingUtils_1.default.logMessage(archive.pointer() + ' total bytes');
                resolve(zipFile);
                return;
            });
            archive.finalize();
        });
    }
}
exports.ArchiveUtils = ArchiveUtils;
