"use strict";
/*
 * Copyright (c) 2019-present Sonatype, Inc. All rights reserved.
 * Includes the third-party code listed at http://links.sonatype.com/products/nexus/attributions.
 * "Sonatype" is a trademark of Sonatype, Inc.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const glob_1 = __importDefault(require("glob"));
const fs = __importStar(require("graceful-fs"));
const NvsPattern = '{**/*.war,**/*.ear,**/*.sar,**/*.jar,' // JAVA
    + '**/node_modules/**,' // JAVA_SCRIPT
    + '**/go.sum,' // GO
    + '**/requirements.txt,' // PYTHON
    + '**/vendor/cache/**,' // RUBY
    + '**/packages/**}'; // DOT_NET
/**
 * A list of all matched files with their absolute paths.
 * @param directory the directory in which to search.
 * @return a list of matched files.
 */
function findFiles(directory) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(directory)) {
            reject(new Error(`Directory ${directory} doesn't exist in your workspace`));
            return;
        }
        glob_1.default(NvsPattern, { nodir: true, absolute: true, cwd: directory }, function (er, files) {
            if (files === undefined || files.length === 0) {
                reject(new Error('Could not find any application bundles or dependencies to scan. Check Example Usage in the README.'));
            }
            else {
                resolve(Array.from(files));
            }
        });
    });
}
exports.findFiles = findFiles;
