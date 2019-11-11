/*
 * Copyright (c) 2019-present Sonatype, Inc. All rights reserved.
 * Includes the third-party code listed at http://links.sonatype.com/products/nexus/attributions.
 * "Sonatype" is a trademark of Sonatype, Inc.
 */

import * as path from 'path';
import * as fs from 'graceful-fs';
import Archiver = require('archiver');
import config from './config.json';
import LoggingUtils from './loggingUtils';

export class ArchiveUtils {

  static async zipFiles(files: Array<string>): Promise<string> {
    return new Promise((resolve, reject) => {

      if (files === undefined || files.length === 0) {
        reject(new Error('no files to zip'));
        return;
      }

      const zipFile = path.join(__dirname, config.uploadService.zipFileName);
      const zipOut = fs.createWriteStream(zipFile);
      const archive = Archiver('zip', {
        zlib: {level: 9}
      });

      archive.pipe(zipOut);
      for (const file of files) {
        archive.append(fs.createReadStream(file), {name: file});
      }

      archive.on('error', (err) => {
        reject(err);
        return;
      });

      zipOut.on('close', () => {
        resolve(zipFile);
        return;
      });

      LoggingUtils.logMessage(`created ${zipFile} file`);
      archive.finalize();
    });

  }
}
