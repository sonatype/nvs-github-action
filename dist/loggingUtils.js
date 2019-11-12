"use strict";
/*
 * Copyright (c) 2019-present Sonatype, Inc. All rights reserved.
 * Includes the third-party code listed at http://links.sonatype.com/products/nexus/attributions.
 * "Sonatype" is a trademark of Sonatype, Inc.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const console_1 = require("console");
class LoggingUtils {
    static logInputField(name, value) {
        this.logger.log(`User input: ${name} = ${value}`);
    }
    static logSeparator() {
        this.logger.log('==============================================================================');
    }
    static logMessage(text) {
        this.logger.log(text);
    }
    static logError(text) {
        this.logger.error(text);
    }
}
exports.default = LoggingUtils;
LoggingUtils.logger = new console_1.Console(process.stdout, process.stderr);
