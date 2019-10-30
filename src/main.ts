/*
 * Copyright (c) 2019-present Sonatype, Inc. All rights reserved.
 * Includes the third-party code listed at http://links.sonatype.com/products/nexus/attributions.
 * "Sonatype" is a trademark of Sonatype, Inc.
 */

import * as core from '@actions/core';
import fs from 'fs';

async function run() {

  try {
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
