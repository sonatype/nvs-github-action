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
const fs = __importStar(require("fs"));
const Archiver = require("archiver");
const config_json_1 = __importDefault(require("./config.json"));
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
            zipOut.on('close', () => {
                resolve(zipFile);
                return;
            });
            archive.finalize();
        });
    }
}
exports.ArchiveUtils = ArchiveUtils;
