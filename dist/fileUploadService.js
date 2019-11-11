"use strict";
/*
 * Copyright (c) 2019-present Sonatype, Inc. All rights reserved.
 * Includes the third-party code listed at http://links.sonatype.com/products/nexus/attributions.
 * "Sonatype" is a trademark of Sonatype, Inc.
 */
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http = __importStar(require("http"));
const fs = __importStar(require("graceful-fs"));
const https = __importStar(require("https"));
const hashUtils_1 = __importDefault(require("./hashUtils"));
const config_json_1 = __importDefault(require("./config.json"));
class FileUploadService {
    constructor(filePath, email, password) {
        this.filePath = filePath;
        this.email = email;
        this.password = password;
    }
    static from(filePath, email, password) {
        return new FileUploadService(filePath, email, password);
    }
    uploadFile() {
        return new Promise((resolve, reject) => {
            http.get(config_json_1.default.uploadService.s3PostPolicy, (resp) => {
                let data = '';
                resp.on('data', (chunk) => {
                    data += chunk;
                });
                resp.on('end', () => {
                    const result = JSON.parse(data);
                    this.uploadFileToS3(result.accessId, result.postPolicy, result.signature).then(result => {
                        resolve(result);
                    }).catch(error => {
                        reject(error);
                    });
                });
            }).on('error', (err) => {
                reject(err.message);
            });
        });
    }
    uploadFileToS3(accessId, postPolicy, signature) {
        return new Promise((resolve, reject) => {
            fs.readFile(this.filePath, (err, content) => {
                if (err) {
                    reject(err);
                    return;
                }
                const payload = this.constructBodyForPostRequest(content, accessId, postPolicy, signature);
                const options = {
                    method: 'POST',
                    hostname: config_json_1.default.uploadService.s3HostName,
                    path: FileUploadService.S3_PATH,
                    port: 443,
                    headers: {
                        'Content-Type': `multipart/form-data; boundary=${FileUploadService.FORM_PARAM_BOUNDARY}`,
                        'Content-Length': payload.length
                    }
                };
                const req = https.request(options, (res) => {
                    if (res.statusCode === 303) {
                        resolve(res.headers.location);
                    }
                    else {
                        reject(new Error('A request returned unexpected status code.'));
                        return;
                    }
                    res.on('data', (d) => {
                        process.stdout.write(d);
                    });
                });
                req.on('error', (err) => {
                    reject(err);
                });
                req.write(payload);
                req.end();
            });
        });
    }
    constructBodyForPostRequest(fileContent, accessId, postPolicy, signature) {
        const data = this.constructMetaData(accessId, postPolicy, signature) + this.constructFileContentPart();
        return Buffer.concat([
            Buffer.from(data, 'utf8'),
            fileContent,
            Buffer.from(`\r\n--${FileUploadService.FORM_PARAM_BOUNDARY}--\r\n`, 'utf8')
        ]);
    }
    constructMetaData(accessId, postPolicy, signature) {
        const guid = hashUtils_1.default.guid();
        const hashedPassword = hashUtils_1.default.md5crypt(this.password, hashUtils_1.default.randomize_md5_salt());
        const metadata = {
            'key': `upload/${guid}/${config_json_1.default.uploadService.zipFileName}`,
            'acl': 'private',
            'Content-Type': 'application/octet-stream',
            'AWSAccessKeyId': accessId,
            'policy': postPolicy,
            'signature': signature,
            'x-amz-meta-mailaddress': this.email,
            'x-amz-meta-scanlabel': `${config_json_1.default.uploadService.zipFileName};${config_json_1.default.integratorName}`,
            'x-amz-meta-password': hashedPassword,
            'success_action_redirect': config_json_1.default.uploadService.successPageRedirect
        };
        let data = '';
        for (const [key, value] of Object.entries(metadata)) {
            data += `--${FileUploadService.FORM_PARAM_BOUNDARY}\r\n`;
            data += `Content-Disposition: form-data; name="${key}"; \r\n\r\n${value}\r\n`;
        }
        return data;
    }
    constructFileContentPart() {
        let data = `--${FileUploadService.FORM_PARAM_BOUNDARY}\r\n`;
        data += `Content-Disposition: form-data; name="file"; filename="${this.filePath}"\r\n`;
        data += 'Content-Type:application/octet-stream\r\n\r\n';
        return data;
    }
}
exports.default = FileUploadService;
FileUploadService.S3_PATH = '/';
FileUploadService.FORM_PARAM_BOUNDARY = '34a15cb8-1e8e-47f1-a71c-76fe5ff7c3e7';
