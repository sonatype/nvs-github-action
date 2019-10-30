/*
 * Copyright (c) 2019-present Sonatype, Inc. All rights reserved.
 * Includes the third-party code listed at http://links.sonatype.com/products/nexus/attributions.
 * "Sonatype" is a trademark of Sonatype, Inc.
 */

import * as core from '@actions/core';
import fs from 'fs';
import {ArchiveUtils} from "./ArchiveUtils";

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

    const file =  await ArchiveUtils.zipFiles(testFiles);

    const email = core.getInput('email');
    const password = core.getInput('password');
    const directory = core.getInput('directory');
    console.log(`email: ${email}`);
    console.log('password: ******');
    console.log(`directory: ${directory}`);

    if (!fs.existsSync(directory)) {
      core.setFailed(`Directory ${directory} doesn't exist in your workspace`);
    }
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

run();
