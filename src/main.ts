/*
 * Copyright (c) 2019-present Sonatype, Inc. All rights reserved.
 * Includes the third-party code listed at http://links.sonatype.com/products/nexus/attributions.
 * "Sonatype" is a trademark of Sonatype, Inc.
 */

import * as core from '@actions/core';
import FileUploadService from './fileUploadService';
import {findFiles} from './scanPattern';
import {ArchiveUtils} from './archiveUtils';
import * as EmailValidator from 'email-validator';
import LoggingUtils from './loggingUtils';

async function run() {
  try {
    const email = core.getInput('email');
    if (!EmailValidator.validate(email)) {
      core.setFailed(`${email} email is not valid`);
    }
    const password = core.getInput('password');
    const directory = core.getInput('directory');

    LoggingUtils.logSeparator();
    LoggingUtils.logInputField('email', email);
    LoggingUtils.logInputField('password', '******');
    LoggingUtils.logInputField('directory', directory);
    LoggingUtils.logSeparator();

    const matchedFiles = await findFiles(directory);
    LoggingUtils.logMessage(`found ${matchedFiles.length} files to scan`);
    LoggingUtils.logMessage('archiving files...');
    const archiveFilePath = await ArchiveUtils.zipFiles(matchedFiles);

    const fileUploadService = FileUploadService.from(archiveFilePath, email, password);
    LoggingUtils.logMessage('upload zip file to NVS...');
    const successUrl = await fileUploadService.uploadFile();
    LoggingUtils.logMessage(`Success url: ${successUrl}`);
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

run();
