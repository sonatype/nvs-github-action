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
const fs_1 = __importDefault(require("fs"));
const ArchiveUtils_1 = require("./ArchiveUtils");
async function run() {
    try {
        const testFiles = ['/Users/vrymbu/lohika/sonatype/fake.jar',
            '/Users/vrymbu/lohika/sonatype/gitlab-recovery-codes.txt',
            '/Users/vrymbu/lohika/sonatype/nexus-iq-cli-1.68.0-01.jar',
            '/Users/vrymbu/lohika/sonatype/nexus-iq-cli-1.69.0-01.jar',
            '/Users/vrymbu/lohika/sonatype/extension-icon.png',
            '/Users/vrymbu/lohika/sonatype/nexus-iq-cli-1.70.0-SNAPSHOT.jar',
            '/Users/vrymbu/lohika/sonatype/reference-policies-v3.json',
            '/Users/vrymbu/lohika/sonatype/tmp/reference-policies-v3.json'
        ];
        const file = await ArchiveUtils_1.ArchiveUtils.zipFiles(testFiles);
        const email = core.getInput('email');
        const password = core.getInput('password');
        const directory = core.getInput('directory');
        console.log(`email: ${email}`);
        console.log('password: ******');
        console.log(`directory: ${directory}`);
        if (!fs_1.default.existsSync(directory)) {
            core.setFailed(`Directory ${directory} doesn't exist in your workspace`);
        }
    }
    catch (error) {
        core.setFailed(error.message);
    }
}
run();
