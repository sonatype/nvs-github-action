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
const core = __importStar(require("@actions/core"));
const fileUploadService_1 = __importDefault(require("./fileUploadService"));
const scanPattern_1 = require("./scanPattern");
const archiveUtils_1 = require("./archiveUtils");
const EmailValidator = __importStar(require("email-validator"));
const loggingUtils_1 = __importDefault(require("./loggingUtils"));
async function run() {
    try {
        const email = core.getInput('email');
        if (!EmailValidator.validate(email)) {
            core.setFailed(`${email} email is not valid`);
        }
        const password = core.getInput('password');
        const directory = core.getInput('directory');
        loggingUtils_1.default.logSeparator();
        loggingUtils_1.default.logInputField('email', email);
        loggingUtils_1.default.logInputField('password', '******');
        loggingUtils_1.default.logInputField('directory', directory);
        loggingUtils_1.default.logSeparator();
        const matchedFiles = await scanPattern_1.findFiles(directory);
        loggingUtils_1.default.logMessage(`found ${matchedFiles.length} files to scan`);
        loggingUtils_1.default.logMessage('archiving files...');
        const archiveFilePath = await archiveUtils_1.ArchiveUtils.zipFiles(matchedFiles);
        const fileUploadService = fileUploadService_1.default.from(archiveFilePath, email, password);
        try {
            loggingUtils_1.default.logMessage('upload zip file to NVS...');
            const successUrl = await fileUploadService.uploadFile();
            loggingUtils_1.default.logMessage(`Success url: ${successUrl}`);
        }
        catch (error) {
            core.setFailed(error);
        }
    }
    catch (error) {
        core.setFailed(error.message);
    }
}
run();
