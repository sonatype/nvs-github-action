/*
 * Copyright (c) 2019-present Sonatype, Inc. All rights reserved.
 * Includes the third-party code listed at http://links.sonatype.com/products/nexus/attributions.
 * "Sonatype" is a trademark of Sonatype, Inc.
 */

import glob from 'glob';
import fs from 'fs';

const NvsPattern =
     '{**/*.war,**/*.ear,**/*.sar,**/*.jar,'  // JAVA
   + '**/node_modules/**,'                    // JAVA_SCRIPT
   + '**/go.sum,'                             // GO
   + '**/requirements.txt,'                   // PYTHON
   + '**/vendor/cache/**,'                    // RUBY
   + '**/packages/**}';                       // DOT_NET

/**
 * A list of all matched files with their absolute paths.
 * @param directory the directory in which to search.
 * @param callback with matched files.
 */
export function findFiles(directory: string, callback: (matchedFiles: string[]) => void) {
  if (!fs.existsSync(directory)) {
    throw Error(`Directory ${directory} doesn't exist in your workspace`);
  }

  glob(NvsPattern, {nodir: true, absolute: true, cwd: directory}, function(er, files) {
    if (files.length === 0) {
      throw Error('No files to scan');
    }
    callback(files);
  });
}