/*
 * Copyright (c) 2019-present Sonatype, Inc. All rights reserved.
 * Includes the third-party code listed at http://links.sonatype.com/products/nexus/attributions.
 * "Sonatype" is a trademark of Sonatype, Inc.
 */

import glob from 'glob';
import fs from 'fs';

const NvsPattern =
     '{**/*.war,**/*.ear,**/*.sar,**/*.jar,' // JAVA
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
export function findFiles(directory: string): Promise<Array<string>> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(directory)) {
      reject(new Error(`Directory ${directory} doesn't exist in your workspace`));
      return;
    }

    glob(NvsPattern, {nodir: true, absolute: true, cwd: directory}, function(er, files) {
      if (files === undefined || files.length === 0) {
        reject(new Error(
            'Could not find any application bundles or dependencies to scan. Check Example Usage in the README.'
        ));
      }
      else {
        resolve(Array.from(files));
      }
    });
  });
}
