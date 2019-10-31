/*
 * Copyright (c) 2019-present Sonatype, Inc. All rights reserved.
 * Includes the third-party code listed at http://links.sonatype.com/products/nexus/attributions.
 * "Sonatype" is a trademark of Sonatype, Inc.
 */

import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import * as fs from 'fs';
import * as rimraf from 'rimraf';
import {findFiles} from "../src/scanPattern";

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

  test('test Java pattern', (done) => {
    const javaPath = path.join(directory, 'java');
    fs.mkdirSync(javaPath);
    fs.open(`${javaPath}/test.jar`, 'w', function() {});
    fs.open(`${javaPath}/server.war`, 'w', function() {});

    findFiles(directory, matchedFiles => {
      expect(matchedFiles.length).toBe(2);
      matchedFiles.forEach(file => {
        const javaRegEx = new RegExp('.*jar|.*war');
        expect(file).toMatch(javaRegEx);
      });
      rimraf.sync(javaPath);
      done();
    });
  });

  test('test Java Script pattern', (done) => {
    const jsPath = path.join(directory, 'js', 'node_modules');
    fs.mkdirSync(jsPath, {recursive: true});
    fs.open(`${jsPath}/someLib.js`, 'w', function() {});
    fs.open(`${jsPath}/devLib.js`, 'w', function() {});

    findFiles(directory, matchedFiles => {
      expect(matchedFiles.length).toBe(2);
      matchedFiles.forEach(file => {
        const javaRegEx = new RegExp('.*js');
        expect(file).toMatch(javaRegEx);
      });
      rimraf.sync(jsPath);
      done();
    });
  });

  test('test GO pattern', (done) => {
    const goPath = path.join(directory, 'go');
    fs.mkdirSync(goPath);
    fs.open(`${goPath}/go.sum`, 'w', function() {});

    findFiles(directory, matchedFiles => {
      expect(matchedFiles.length).toBe(1);
      matchedFiles.forEach(file => {
        const javaRegEx = new RegExp('.*go.sum');
        expect(file).toMatch(javaRegEx);
      });
      rimraf.sync(goPath);
      done();
    });
  });

  test('test Python pattern', (done) => {
    const pythonPath = path.join(directory, 'python');
    fs.mkdirSync(pythonPath);
    fs.open(`${pythonPath}/requirements.txt`, 'w', function() {});

    findFiles(directory, matchedFiles => {
      expect(matchedFiles.length).toBe(1);
      matchedFiles.forEach(file => {
        const javaRegEx = new RegExp('.*requirements.txt');
        expect(file).toMatch(javaRegEx);
      });
      rimraf.sync(pythonPath);
      done();
    });
  });

  test('test Ruby pattern', (done) => {
    const rubyPath = path.join(directory, 'ruby', 'vendor', 'cache');
    fs.mkdirSync(rubyPath, {recursive: true});
    const vendorDir = path.join(rubyPath, 'vendor_1');
    fs.mkdirSync(vendorDir);
    fs.open(`${vendorDir}/someLib.rb`, 'w', function() {});

    const vendorDir2 = path.join(rubyPath, 'vendor_2');
    fs.mkdirSync(vendorDir2);
    fs.open(`${vendorDir2}/someLib2.rb`, 'w', function() {});

    findFiles(directory, matchedFiles => {
      expect(matchedFiles.length).toBe(2);
      matchedFiles.forEach(file => {
        const javaRegEx = new RegExp('.*vendor/cache');
        expect(file).toMatch(javaRegEx);
      });
      rimraf.sync(rubyPath);
      done();
    });
  });

  test('test .NET pattern', (done) => {
    const netPath = path.join(directory, 'net', 'packages');
    fs.mkdirSync(netPath, {recursive: true});
    fs.open(`${netPath}/someLib.Library`, 'w', function() {});
    fs.open(`${netPath}/devLib.Library`, 'w', function() {});
    fs.open(`${netPath}/file.Xdt`, 'w', function() {});

    findFiles(directory, matchedFiles => {
      expect(matchedFiles.length).toBe(3);
      matchedFiles.forEach(file => {
        const javaRegEx = new RegExp('.*packages');
        expect(file).toMatch(javaRegEx);
      });
      rimraf.sync(netPath);
      done();
    });
  });

});

// shows how the runner will run a javascript action with env / stdout protocol
test('test GitHub Actions', () => {
  process.env['INPUT_EMAIL'] = 'test@test.com';
  process.env['INPUT_PASSWORD'] = 'admin123';
  process.env['INPUT_DIRECTORY'] = directory;

  const javaPath = path.join(directory, 'java');
  fs.mkdirSync(javaPath);
  fs.open(`${javaPath}/some.jar`, 'w', function() {});

  const ip = path.join(__dirname, '..', 'lib', 'main.js');
  const options: cp.ExecSyncOptions = {
    env: process.env
  };
  console.log(cp.execSync(`node ${ip}`, options).toString());
  rimraf.sync(javaPath);
});
