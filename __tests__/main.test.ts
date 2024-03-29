/*
 * Copyright (c) 2019-present Sonatype, Inc. All rights reserved.
 * Includes the third-party code listed at http://links.sonatype.com/products/nexus/attributions.
 * "Sonatype" is a trademark of Sonatype, Inc.
 */

import * as path from 'path';
import * as fs from 'graceful-fs';
import * as rimraf from 'rimraf';
import {findFiles} from '../src/scanPattern';

const directory = path.join(__dirname, 'workspace');

beforeAll(() => {
  // create temp dir
  fs.mkdirSync(directory);
});

afterAll(() => {
  // recursively remove temp dir
  rimraf.sync(directory);
});

describe('test search patterns', () => {

  test('test Java pattern', async () => {
    const javaPath = path.join(directory, 'java');
    fs.mkdirSync(javaPath);
    fs.open(`${javaPath}/test.jar`, 'w', () => void 0);
    fs.open(`${javaPath}/server.war`, 'w', () => void 0);

    const matchedFiles = await findFiles(directory);
    expect(matchedFiles.length).toBe(2);
    matchedFiles.forEach(file => {
      const javaRegEx = new RegExp('.*jar|.*war');
      expect(file).toMatch(javaRegEx);
    });
    rimraf.sync(javaPath);
  });

  test('test Java Script pattern', async () => {
    const jsPath = path.join(directory, 'js', 'node_modules');
    fs.mkdirSync(jsPath, {recursive: true});
    fs.open(`${jsPath}/someLib.js`, 'w', () => void 0);
    fs.open(`${jsPath}/devLib.js`, 'w', () => void 0);

    const matchedFiles = await findFiles(directory);
    expect(matchedFiles.length).toBe(2);
    matchedFiles.forEach(file => {
      const javaRegEx = new RegExp('.*js');
      expect(file).toMatch(javaRegEx);
    });
    rimraf.sync(jsPath);
  });

  test('test GO pattern', async () => {
    const goPath = path.join(directory, 'go');
    fs.mkdirSync(goPath);
    fs.open(`${goPath}/go.sum`, 'w', () => void 0);

    const matchedFiles = await findFiles(directory);
    expect(matchedFiles.length).toBe(1);
    matchedFiles.forEach(file => {
      const javaRegEx = new RegExp('.*go.sum');
      expect(file).toMatch(javaRegEx);
    });
    rimraf.sync(goPath);
  });

  test('test Python pattern', async () => {
    const pythonPath = path.join(directory, 'python');
    fs.mkdirSync(pythonPath);
    fs.open(`${pythonPath}/requirements.txt`, 'w', () => void 0);

    const matchedFiles = await findFiles(directory);
    expect(matchedFiles.length).toBe(1);
    matchedFiles.forEach(file => {
      const javaRegEx = new RegExp('.*requirements.txt');
      expect(file).toMatch(javaRegEx);
    });
    rimraf.sync(pythonPath);
  });

  test('test Ruby pattern', async () => {
    const rubyPath = path.join(directory, 'ruby', 'vendor', 'cache');
    fs.mkdirSync(rubyPath, {recursive: true});
    const vendorDir = path.join(rubyPath, 'vendor_1');
    fs.mkdirSync(vendorDir);
    fs.open(`${vendorDir}/someLib.rb`, 'w', () => void 0);

    const vendorDir2 = path.join(rubyPath, 'vendor_2');
    fs.mkdirSync(vendorDir2);
    fs.open(`${vendorDir2}/someLib2.rb`, 'w', () => void 0);

    const matchedFiles = await findFiles(directory);
    expect(matchedFiles.length).toBe(2);
    matchedFiles.forEach(file => {
      const javaRegEx = new RegExp('.*vendor/cache');
      expect(file).toMatch(javaRegEx);
    });
    rimraf.sync(rubyPath);
  });

  test('test .NET pattern', async () => {
    const netPath = path.join(directory, 'net', 'packages');
    fs.mkdirSync(netPath, {recursive: true});
    fs.open(`${netPath}/someLib.Library`, 'w', () => void 0);
    fs.open(`${netPath}/devLib.Library`, 'w', () => void 0);
    fs.open(`${netPath}/file.Xdt`, 'w', () => void 0);

    const matchedFiles = await findFiles(directory);
    expect(matchedFiles.length).toBe(3);
    matchedFiles.forEach(file => {
      const javaRegEx = new RegExp('.*packages');
      expect(file).toMatch(javaRegEx);
    });
    rimraf.sync(netPath);
  });

});
