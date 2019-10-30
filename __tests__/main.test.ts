/*
 * Copyright (c) 2019-present Sonatype, Inc. All rights reserved.
 * Includes the third-party code listed at http://links.sonatype.com/products/nexus/attributions.
 * "Sonatype" is a trademark of Sonatype, Inc.
 */

import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import * as fs from 'fs';

// shows how the runner will run a javascript action with env / stdout protocol
test('test runs', () => {
    const directory = 'workspace';
    process.env['INPUT_EMAIL'] = 'test@test.com';
    process.env['INPUT_PASSWORD'] = 'admin123';
    process.env['INPUT_DIRECTORY'] = directory;

    fs.mkdirSync(directory);

    const ip = path.join(__dirname, '..', 'lib', 'main.js');
    const options: cp.ExecSyncOptions = {
        env: process.env
    };
    console.log(cp.execSync(`node ${ip}`, options).toString());

    fs.rmdirSync(directory);
});
