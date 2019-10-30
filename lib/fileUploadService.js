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
const fs = __importStar(require("fs"));
const https = __importStar(require("https"));
const hashUtils_1 = __importDefault(require("./hashUtils"));
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
        http.get(FileUploadService.S3_POST_POLICY, (resp) => {
            let data = "";
            resp.on('data', (chunk) => {
                data += chunk;
            });
            resp.on('end', () => {
                const result = JSON.parse(data);
                console.log("================ Get request result ================");
                console.log(result);
                console.log("====================================================");
                this.uploadFileToS3(result.accessId, result.postPolicy, result.signature);
            });
        }).on("error", (err) => {
            console.log("Error: " + err.message);
        });
    }
    uploadFileToS3(accessId, postPolicy, signature) {
        fs.readFile(this.filePath, (err, content) => {
            if (err) {
                console.error();
                return;
            }
            const payload = this.constructBodyForPostRequest(content, accessId, postPolicy, signature);
            const options = {
                method: 'POST',
                hostname: FileUploadService.S3_HOSTNAME,
                path: FileUploadService.S3_PATH,
                port: 443,
                headers: {
                    "Content-Type": "multipart/form-data; boundary=" + FileUploadService.FORM_PARAM_BOUNDARY,
                    'Content-Length': payload.length
                }
            };
            const req = https.request(options, (res) => {
                console.log('statusCode:', res.statusCode);
                console.log('headers:', res.headers);
                res.on('data', (d) => {
                    process.stdout.write(d);
                });
            });
            req.on('error', (e) => {
                console.error(e);
            });
            req.write(payload);
            req.end();
        });
    }
    constructBodyForPostRequest(fileContent, accessId, postPolicy, signature) {
        const data = this.constructMetaData(accessId, postPolicy, signature) + this.constructFileContentPart();
        // @ts-ignore
        return Buffer.concat([
            Buffer.from(data, "utf8"),
            Buffer.from(fileContent, "binary"),
            Buffer.from("\r\n--" + FileUploadService.FORM_PARAM_BOUNDARY + "--\r\n", "utf8")
        ]);
    }
    constructMetaData(accessId, postPolicy, signature) {
        const metadata = {
            "key": "upload/" + hashUtils_1.default.guid() + "/somefile.jar",
            "acl": "private",
            "Content-Type": "application/octet-stream",
            "AWSAccessKeyId": accessId,
            "policy": postPolicy,
            "signature": signature,
            "x-amz-meta-mailaddress": this.email,
            "x-amz-meta-scanlabel": "somefile.jar;" + FileUploadService.GITHUB_ACTIONS,
            "x-amz-meta-password": hashUtils_1.default.md5crypt(this.password, hashUtils_1.default.randomize_md5_salt()),
            "success_action_redirect": FileUploadService.SUCCESS_PAGE_REDIRECT
        };
        let data = "";
        for (let i in metadata) {
            if ({}.hasOwnProperty.call(metadata, i)) {
                data += "--" + FileUploadService.FORM_PARAM_BOUNDARY + "\r\n";
                // @ts-ignore
                data += "Content-Disposition: form-data; name=\"" + i + "\"; \r\n\r\n" + metadata[i] + "\r\n";
            }
        }
        return data;
    }
    constructFileContentPart() {
        let data = "--" + FileUploadService.FORM_PARAM_BOUNDARY + "\r\n";
        data += "Content-Disposition: form-data; name=\"file\"; filename=\"" + this.filePath + "\"\r\n";
        data += "Content-Type:application/octet-stream\r\n\r\n";
        return data;
    }
}
FileUploadService.S3_POST_POLICY = "http://production-sonatype-nvs-cloud-scanner-post-policy.s3-website-us-east-1.amazonaws.com/post-policy-signed.json";
FileUploadService.S3_HOSTNAME = "production-sonatype-nvs-cloud-scanner-file-storage.s3.amazonaws.com";
FileUploadService.S3_PATH = "/";
FileUploadService.SUCCESS_PAGE_REDIRECT = "https://www.sonatype.com/nvs-cloud-thank-you";
FileUploadService.FORM_PARAM_BOUNDARY = "34a15cb8-1e8e-47f1-a71c-76fe5ff7c3e7";
FileUploadService.GITHUB_ACTIONS = "github-actions";
exports.default = FileUploadService;
