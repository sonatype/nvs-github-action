/*
 * Copyright (c) 2019-present Sonatype, Inc. All rights reserved.
 * Includes the third-party code listed at http://links.sonatype.com/products/nexus/attributions.
 * "Sonatype" is a trademark of Sonatype, Inc.
 */

import * as http from "http";
import * as fs from "fs";
import * as https from "https";
import HashUtils from "./hashUtils";

type PostRequestMetadataKeys = "key" | "acl" | "Content-Type" | "AWSAccessKeyId" | "policy" | "signature" |
  "x-amz-meta-mailaddress" | "x-amz-meta-scanlabel" | "x-amz-meta-password" | "success_action_redirect"

type PostRequestMetadata = { [key in PostRequestMetadataKeys]: string }

export default class FileUploadService {
  
  private static readonly S3_POST_POLICY = "http://production-sonatype-nvs-cloud-scanner-post-policy.s3-website-us-east-1.amazonaws.com/post-policy-signed.json";
  private static readonly S3_HOSTNAME = "production-sonatype-nvs-cloud-scanner-file-storage.s3.amazonaws.com";
  private static readonly S3_PATH = "/";
  private static readonly SUCCESS_PAGE_REDIRECT = "https://www.sonatype.com/nvs-cloud-thank-you";
  
  private static readonly FORM_PARAM_BOUNDARY = "34a15cb8-1e8e-47f1-a71c-76fe5ff7c3e7";
  
  private static readonly GITHUB_ACTIONS = "github-actions";
  
  private readonly filePath: string;
  private readonly email: string;
  private readonly password: string;
  
  private constructor(filePath: string, email: string, password: string) {
    this.filePath = filePath;
    this.email = email;
    this.password = password;
  }
  
  static from(filePath: string, email: string, password: string): FileUploadService {
    return new FileUploadService(filePath, email, password);
  }
  
  uploadFile(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      http.get(FileUploadService.S3_POST_POLICY, (resp) => {
        let data = "";
      
        resp.on("data", (chunk) => {
          data += chunk;
        });
      
        resp.on("end", () => {
          const result = JSON.parse(data);
          this.uploadFileToS3(result.accessId, result.postPolicy, result.signature).then(result => {
            resolve(result);
          }).catch(error => {
            reject(error);
          })
        });
      
      }).on("error", (err) => {
        reject(err.message);
      });
    })
  }
  
  private uploadFileToS3(accessId: string, postPolicy: string, signature: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      fs.readFile(this.filePath, (err, content: Buffer) => {
        if (err) {
          reject(err);
        }
        
        const payload = this.constructBodyForPostRequest(content, accessId, postPolicy, signature);
        
        const options = {
          method: "POST",
          hostname: FileUploadService.S3_HOSTNAME,
          path: FileUploadService.S3_PATH,
          port: 443,
          headers: {
            "Content-Type": `multipart/form-data; boundary=${FileUploadService.FORM_PARAM_BOUNDARY}`,
            "Content-Length": payload.length
          }
        };
        
        const req = https.request(options, (res) => {
          if (res.statusCode == 303) {
            resolve(res.headers.location);
          } else {
            reject(new Error("A request returned unexpected status code."));
          }
          
          res.on("data", (d) => {
            process.stdout.write(d);
          });
        });
        
        req.on("error", (err) => {
          reject(err);
        });
        
        req.write(payload);
        req.end();
      })
    })
  }
  
  private constructBodyForPostRequest(fileContent: Buffer, accessId: string, postPolicy: string, signature: string) {
    const data = this.constructMetaData(accessId, postPolicy, signature) + this.constructFileContentPart();
    
    return  Buffer.concat([
      Buffer.from(data, "utf8"),
      fileContent,
      Buffer.from(`\r\n--${FileUploadService.FORM_PARAM_BOUNDARY}--\r\n`, "utf8")
    ]);
  }
  
  private constructMetaData(accessId: string, postPolicy: string, signature: string) {
    const guid = HashUtils.guid();
    const hashedPassword = HashUtils.md5crypt(this.password, HashUtils.randomize_md5_salt());
    
    const metadata: PostRequestMetadata = {
      "key": `upload/${guid}/somefile.jar`,
      "acl": "private",
      "Content-Type": "application/octet-stream",
      "AWSAccessKeyId": accessId,
      "policy": postPolicy,
      "signature": signature,
      "x-amz-meta-mailaddress": this.email,
      "x-amz-meta-scanlabel": `somefile.jar;${FileUploadService.GITHUB_ACTIONS}`,
      "x-amz-meta-password": hashedPassword,
      "success_action_redirect": FileUploadService.SUCCESS_PAGE_REDIRECT
    };
    
    let data = "";
    for (let [key, value] of Object.entries(metadata)) {
      data += `--${FileUploadService.FORM_PARAM_BOUNDARY}\r\n`;
      data += `Content-Disposition: form-data; name="${key}"; \r\n\r\n${value}\r\n`;
    }
    
    return data;
  }
  
  private constructFileContentPart() {
    let data = `--${FileUploadService.FORM_PARAM_BOUNDARY}\r\n`;
    data += `Content-Disposition: form-data; name="file"; filename="${this.filePath}"\r\n`;
    data += "Content-Type:application/octet-stream\r\n\r\n";
    return data;
  }
}
