/*
 * Copyright (c) 2019-present Sonatype, Inc. All rights reserved.
 * Includes the third-party code listed at http://links.sonatype.com/products/nexus/attributions.
 * "Sonatype" is a trademark of Sonatype, Inc.
 */

import {Console} from 'console';

export default class LoggingUtils {

  private static readonly logger = new Console(process.stdout, process.stderr);

  static logInputField(name: string, value: string) {
    this.logger.log(`User input: ${name} = ${value}`);
  }

  static logSeparator() {
    this.logger.log('==============================================================================');
  }

  static logMessage(text: string) {
    this.logger.log(text);
  }

  static logError(text: string) {
    this.logger.error(text);
  }
}
