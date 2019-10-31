/*
 * Copyright (c) 2019-present Sonatype, Inc. All rights reserved.
 * Includes the third-party code listed at http://links.sonatype.com/products/nexus/attributions.
 * "Sonatype" is a trademark of Sonatype, Inc.
 */

import * as core from '@actions/core';
import {findFiles} from "./scanPattern";

async function run() {
  try {
    const email = core.getInput('email');
    const password = core.getInput('password');
    const directory = core.getInput('directory');
    console.log(`email: ${email}`);
    console.log('password: ******');
    console.log(`directory: ${directory}`);

    findFiles(directory, matchedFiles => {
      console.log(`Found ${matchedFiles.length} files`);
      matchedFiles.forEach(file => console.log(file));
      // TODO Zip files under the INTC-109
    });
  }
  catch (error) {
    core.setFailed(error.message);
  }
}

run();
