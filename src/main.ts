/*
 * Copyright (c) 2019-present Sonatype, Inc. All rights reserved.
 * Includes the third-party code listed at http://links.sonatype.com/products/nexus/attributions.
 * "Sonatype" is a trademark of Sonatype, Inc.
 */

import * as core from '@actions/core';
import * as path from "path";
import FileUploadService from "./fileUploadService";
import {findFiles} from "./scanPattern";
import {ArchiveUtils} from "./ArchiveUtils";

async function run() {
  try {
    const email = core.getInput('email');
    const password = core.getInput('password');
    const directory = core.getInput('directory');
    console.log(`email: ${email}`);
    console.log('password: ******');
    console.log(`directory: ${directory}`);

    const matchedFiles = await findFiles(directory);
    const archiveFilePath = await ArchiveUtils.zipFiles(matchedFiles);

    const fileUploadService = FileUploadService.from(archiveFilePath, email, password);
    try {
      const successUrl = await fileUploadService.uploadFile();
      console.log(`Success url: ${successUrl}`);
    } catch (error) {
      core.setFailed(error);
    }
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

run();
