
import * as fs from 'fs';
import Archiver = require('archiver');

export class ArchiveUtils {

  static async zipFiles(files: Array<string>): Promise<string> {
    return new Promise((resolve, reject) => {

      if (files === undefined || files.length === 0) {
        reject(new Error('no files to zip'));
      }

      const zipFile = __dirname + '/dataToScan.zip';
      const zipOut = fs.createWriteStream(zipFile);
      const archive = Archiver('zip', {
        zlib: {level: 9}
      });

      archive.pipe(zipOut);
      for (const file of files) {
        archive.append(fs.createReadStream(file), {name: file});
      }

      archive.on('error', function(err) {
        reject(err);
      });

      zipOut.on('close', function() {
        console.log(`${zipFile} has been created with ${archive.pointer()} total bytes`);
        resolve(zipFile);
      });

      archive.finalize();
    });

  }
}
