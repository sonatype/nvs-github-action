/*
 * Copyright (c) 2019-present Sonatype, Inc. All rights reserved.
 * Includes the third-party code listed at http://links.sonatype.com/products/nexus/attributions.
 * "Sonatype" is a trademark of Sonatype, Inc.
 */

import * as fs from "fs";
import * as rimraf from "rimraf";
import * as path from "path";
import {ArchiveUtils} from "../src/ArchiveUtils";

const directory = path.join(__dirname, 'workspace');

beforeAll(() => {
  // create temp dir
  fs.mkdirSync(directory);
});

afterAll(() => {
  // recursively remove temp dir
  rimraf.sync(directory);
});

describe('Archiver Utils tests', () => {

  test('zip file should be created', async () => {
    const javaPath = path.join(directory, 'java');
    fs.mkdirSync(javaPath);
    fs.open(`${javaPath}/test.jar`, 'w', function() {});
    fs.open(`${javaPath}/server.war`, 'w', function() {});
    const files: Array<string> = [`${javaPath}/test.jar`, `${javaPath}/server.war`];

    const zipFileName = await ArchiveUtils.zipFiles(files);
    expect(fs.statSync(zipFileName).isFile()).toBeTruthy();
    fs.unlinkSync(zipFileName);
  });

  test('should fail on empty array', async () => {
    const files: Array<string> = [];
    await expect(ArchiveUtils.zipFiles(files)).rejects.toThrow(new Error("no files to zip"));
  });

});
