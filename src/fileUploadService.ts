/*
 * Copyright (c) 2019-present Sonatype, Inc. All rights reserved.
 * Includes the third-party code listed at http://links.sonatype.com/products/nexus/attributions.
 * "Sonatype" is a trademark of Sonatype, Inc.
 */

import * as http from "http";
import * as fs from "fs";
import * as https from "https";
import HashUtils from "./hashUtils";

type PostRequestMetadataKeys = "key" | "acl" | "Content-Type" | "AWSAccessKeyId" | "policy" | "signature"
  | "x-amz-meta-mailaddress" | "x-amz-meta-scanlabel" | "x-amz-meta-password" | "success_action_redirect"

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
  
  private uploadFileToS3(accessId: string, postPolicy: string, signature: string) {
    fs.readFile(this.filePath, (err, content: Buffer) => {
      console.log("================= Going to upload a file ==============");
      
      if (err) {
        console.log("================= Error happened ==============");
        console.log(err);
        return;
      }
      
      const payload = this.constructBodyForPostRequest(content, accessId, postPolicy, signature);
  
      console.log("================= After body construction ==============");
      
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
    })
  }
  
  private constructBodyForPostRequest(fileContent: any, accessId: string, postPolicy: string, signature: string) {
    const data = this.constructMetaData(accessId, postPolicy, signature) + this.constructFileContentPart();
    
    // @ts-ignore
    return  Buffer.concat([
      Buffer.from(data, "utf8"),
      Buffer.from(fileContent, "binary"),
      Buffer.from("\r\n--" + FileUploadService.FORM_PARAM_BOUNDARY + "--\r\n", "utf8")
    ]);
  }
  
  private constructMetaData(accessId: string, postPolicy: string, signature: string) {
    const metadata: PostRequestMetadata = {
      "key": "upload/" + HashUtils.guid() + "/somefile.jar",
      "acl": "private",
      "Content-Type": "application/octet-stream",
      "AWSAccessKeyId": accessId,
      "policy": postPolicy,
      "signature": signature,
      "x-amz-meta-mailaddress": this.email,
      "x-amz-meta-scanlabel": "somefile.jar;" + FileUploadService.GITHUB_ACTIONS,
      "x-amz-meta-password": HashUtils.md5crypt(this.password, HashUtils.randomize_md5_salt()),
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
  
  private constructFileContentPart() {
    let data = "--" + FileUploadService.FORM_PARAM_BOUNDARY + "\r\n";
    data += "Content-Disposition: form-data; name=\"file\"; filename=\"" + this.filePath + "\"\r\n";
    data += "Content-Type:application/octet-stream\r\n\r\n";
    return data;
  }
}
