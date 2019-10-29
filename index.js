const http = require('http');
const https = require('https');
const fs = require('fs');

const password = 'your_password';
const email = 'your_email_to_send_results_to';
const githubactions = 'github-actions';

const filePath = "your_zip_file_to_scan";

const hostname = "production-sonatype-nvs-cloud-scanner-file-storage.s3.amazonaws.com";
const path = "/";
const policy = "http://production-sonatype-nvs-cloud-scanner-post-policy.s3-website-us-east-1.amazonaws.com/post-policy-signed.json";

const ascii64 = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

// a uuid needed for separating form-data parameters in post request
// https://www.w3.org/TR/html401/interact/forms.html#h-17.13.4
const boundary = "34a15cb8-1e8e-47f1-a71c-76fe5ff7c3e7";

function random_salt(length) {
  let salt = '';
  for (let i = 0; i < length; i++) {
    salt += ascii64.charAt(Math.floor(64 * Math.random()));
  }
  return salt;
}

function randomize_md5_salt() {
  return random_salt(8);
}

function md5crypt(password, salt) {
  let ctx = password + '$apr1$' + salt;
  let ctx1 = str_md5(password + salt + password);

  /* "Just as many characters of ctx1" (as there are in the password) */
  for (let pl = password.length; pl > 0; pl -= 16) {
    ctx += ctx1.slice(0, (pl > 16) ? 16 : pl);
  }

  /* "Then something really weird" */
  for (var i = password.length; i !== 0; i >>= 1) {
    if (i & 1) {
      ctx += '\0';
    }
    else {
      ctx += password.charAt(0);
    }
  }

  ctx = str_md5(ctx);

  /* "Just to make sure things don't run too fast" */
  for (i = 0; i < 1000; i++) {
    ctx1 = '';
    if (i & 1) {
      ctx1 += password;
    }
    else {
      ctx1 += ctx;
    }

    if (i % 3) {ctx1 += salt;}

    if (i % 7) {ctx1 += password;}

    if (i & 1) {
      ctx1 += ctx;
    }
    else {
      ctx1 += password;
    }

    ctx = str_md5(ctx1);
  }

  return '$apr1$' + salt + '$' +
      to64_triplet(ctx, 0, 6, 12) +
      to64_triplet(ctx, 1, 7, 13) +
      to64_triplet(ctx, 2, 8, 14) +
      to64_triplet(ctx, 3, 9, 15) +
      to64_triplet(ctx, 4, 10, 5) +
      to64_single(ctx, 11);
}

function to64(v, n) {
  let s = '';
  while (--n >= 0) {
    s += ascii64.charAt(v & 0x3f);
    v >>= 6;
  }
  return s;
}

function to64_triplet(str, idx0, idx1, idx2) {
  const v = (str.charCodeAt(idx0) << 16) |
      (str.charCodeAt(idx1) << 8) |
      (str.charCodeAt(idx2));
  return to64(v, 4);
}

function to64_single(str, idx0) {
  const v = str.charCodeAt(idx0);
  return to64(v, 2);
}

const /** !Array<number> */ des_key_shifts = [
  1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1
];

const /** !Array<!Array<number>> */ key_perm_maskl = new Array(8);
const /** !Array<!Array<number>> */ key_perm_maskr = new Array(8);
const /** !Array<!Array<number>> */ comp_maskl = new Array(8);
const /** !Array<!Array<number>> */ comp_maskr = new Array(8);

const en_keysl = new Array(16),
    en_keysr = new Array(16);

/**
 * @param {!Array<number>} key
 */
function des_setkey(key) {
  let rawkey0, rawkey1, k0, k1;

  rawkey0 = (key[0] << 24) |
      (key[1] << 16) |
      (key[2] << 8) |
      (key[3] << 0);

  rawkey1 = (key[4] << 24) |
      (key[5] << 16) |
      (key[6] << 8) |
      (key[7] << 0);

  /* Do key permutation and split into two 28-bit subkeys. */
  k0 = key_perm_maskl[0][rawkey0 >>> 25]
      | key_perm_maskl[1][(rawkey0 >>> 17) & 0x7f]
      | key_perm_maskl[2][(rawkey0 >>> 9) & 0x7f]
      | key_perm_maskl[3][(rawkey0 >>> 1) & 0x7f]
      | key_perm_maskl[4][rawkey1 >>> 25]
      | key_perm_maskl[5][(rawkey1 >>> 17) & 0x7f]
      | key_perm_maskl[6][(rawkey1 >>> 9) & 0x7f]
      | key_perm_maskl[7][(rawkey1 >>> 1) & 0x7f];
  k1 = key_perm_maskr[0][rawkey0 >>> 25]
      | key_perm_maskr[1][(rawkey0 >>> 17) & 0x7f]
      | key_perm_maskr[2][(rawkey0 >>> 9) & 0x7f]
      | key_perm_maskr[3][(rawkey0 >>> 1) & 0x7f]
      | key_perm_maskr[4][rawkey1 >>> 25]
      | key_perm_maskr[5][(rawkey1 >>> 17) & 0x7f]
      | key_perm_maskr[6][(rawkey1 >>> 9) & 0x7f]
      | key_perm_maskr[7][(rawkey1 >>> 1) & 0x7f];

  /* Rotate subkeys and do compression permutation. */
  let shifts = 0;
  for (let round = 0; round < 16; round++) {
    let t0, t1;

    shifts += des_key_shifts[round];

    t0 = (k0 << shifts) | (k0 >>> (28 - shifts));
    t1 = (k1 << shifts) | (k1 >>> (28 - shifts));

    en_keysl[round] = comp_maskl[0][(t0 >>> 21) & 0x7f]
        | comp_maskl[1][(t0 >>> 14) & 0x7f]
        | comp_maskl[2][(t0 >>> 7) & 0x7f]
        | comp_maskl[3][t0 & 0x7f]
        | comp_maskl[4][(t1 >>> 21) & 0x7f]
        | comp_maskl[5][(t1 >>> 14) & 0x7f]
        | comp_maskl[6][(t1 >>> 7) & 0x7f]
        | comp_maskl[7][t1 & 0x7f];

    en_keysr[round] = comp_maskr[0][(t0 >>> 21) & 0x7f]
        | comp_maskr[1][(t0 >>> 14) & 0x7f]
        | comp_maskr[2][(t0 >>> 7) & 0x7f]
        | comp_maskr[3][t0 & 0x7f]
        | comp_maskr[4][(t1 >>> 21) & 0x7f]
        | comp_maskr[5][(t1 >>> 14) & 0x7f]
        | comp_maskr[6][(t1 >>> 7) & 0x7f]
        | comp_maskr[7][t1 & 0x7f];
  }
}

const chrsz = 8;

function str_md5(s) {
  return binl2str(core_md5(str2binl(s), s.length * chrsz));
}

function core_md5(x, len) {
  /* append padding */
  x[len >> 5] |= 0x80 << ((len) % 32);
  x[(((len + 64) >>> 9) << 4) + 14] = len;

  let a = 1732584193;
  let b = -271733879;
  let c = -1732584194;
  let d = 271733878;

  for (let i = 0; i < x.length; i += 16) {
    const olda = a;
    const oldb = b;
    const oldc = c;
    const oldd = d;

    a = md5_ff(a, b, c, d, x[i + 0], 7, -680876936);
    d = md5_ff(d, a, b, c, x[i + 1], 12, -389564586);
    c = md5_ff(c, d, a, b, x[i + 2], 17, 606105819);
    b = md5_ff(b, c, d, a, x[i + 3], 22, -1044525330);
    a = md5_ff(a, b, c, d, x[i + 4], 7, -176418897);
    d = md5_ff(d, a, b, c, x[i + 5], 12, 1200080426);
    c = md5_ff(c, d, a, b, x[i + 6], 17, -1473231341);
    b = md5_ff(b, c, d, a, x[i + 7], 22, -45705983);
    a = md5_ff(a, b, c, d, x[i + 8], 7, 1770035416);
    d = md5_ff(d, a, b, c, x[i + 9], 12, -1958414417);
    c = md5_ff(c, d, a, b, x[i + 10], 17, -42063);
    b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
    a = md5_ff(a, b, c, d, x[i + 12], 7, 1804603682);
    d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
    c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
    b = md5_ff(b, c, d, a, x[i + 15], 22, 1236535329);

    a = md5_gg(a, b, c, d, x[i + 1], 5, -165796510);
    d = md5_gg(d, a, b, c, x[i + 6], 9, -1069501632);
    c = md5_gg(c, d, a, b, x[i + 11], 14, 643717713);
    b = md5_gg(b, c, d, a, x[i + 0], 20, -373897302);
    a = md5_gg(a, b, c, d, x[i + 5], 5, -701558691);
    d = md5_gg(d, a, b, c, x[i + 10], 9, 38016083);
    c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
    b = md5_gg(b, c, d, a, x[i + 4], 20, -405537848);
    a = md5_gg(a, b, c, d, x[i + 9], 5, 568446438);
    d = md5_gg(d, a, b, c, x[i + 14], 9, -1019803690);
    c = md5_gg(c, d, a, b, x[i + 3], 14, -187363961);
    b = md5_gg(b, c, d, a, x[i + 8], 20, 1163531501);
    a = md5_gg(a, b, c, d, x[i + 13], 5, -1444681467);
    d = md5_gg(d, a, b, c, x[i + 2], 9, -51403784);
    c = md5_gg(c, d, a, b, x[i + 7], 14, 1735328473);
    b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);

    a = md5_hh(a, b, c, d, x[i + 5], 4, -378558);
    d = md5_hh(d, a, b, c, x[i + 8], 11, -2022574463);
    c = md5_hh(c, d, a, b, x[i + 11], 16, 1839030562);
    b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
    a = md5_hh(a, b, c, d, x[i + 1], 4, -1530992060);
    d = md5_hh(d, a, b, c, x[i + 4], 11, 1272893353);
    c = md5_hh(c, d, a, b, x[i + 7], 16, -155497632);
    b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
    a = md5_hh(a, b, c, d, x[i + 13], 4, 681279174);
    d = md5_hh(d, a, b, c, x[i + 0], 11, -358537222);
    c = md5_hh(c, d, a, b, x[i + 3], 16, -722521979);
    b = md5_hh(b, c, d, a, x[i + 6], 23, 76029189);
    a = md5_hh(a, b, c, d, x[i + 9], 4, -640364487);
    d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
    c = md5_hh(c, d, a, b, x[i + 15], 16, 530742520);
    b = md5_hh(b, c, d, a, x[i + 2], 23, -995338651);

    a = md5_ii(a, b, c, d, x[i + 0], 6, -198630844);
    d = md5_ii(d, a, b, c, x[i + 7], 10, 1126891415);
    c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
    b = md5_ii(b, c, d, a, x[i + 5], 21, -57434055);
    a = md5_ii(a, b, c, d, x[i + 12], 6, 1700485571);
    d = md5_ii(d, a, b, c, x[i + 3], 10, -1894986606);
    c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
    b = md5_ii(b, c, d, a, x[i + 1], 21, -2054922799);
    a = md5_ii(a, b, c, d, x[i + 8], 6, 1873313359);
    d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
    c = md5_ii(c, d, a, b, x[i + 6], 15, -1560198380);
    b = md5_ii(b, c, d, a, x[i + 13], 21, 1309151649);
    a = md5_ii(a, b, c, d, x[i + 4], 6, -145523070);
    d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
    c = md5_ii(c, d, a, b, x[i + 2], 15, 718787259);
    b = md5_ii(b, c, d, a, x[i + 9], 21, -343485551);

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
  }
  return [a, b, c, d];
}

function md5_cmn(q, a, b, x, s, t) {
  return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b);
}

function md5_ff(a, b, c, d, x, s, t) {
  return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
}

function md5_gg(a, b, c, d, x, s, t) {
  return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
}

function md5_hh(a, b, c, d, x, s, t) {
  return md5_cmn(b ^ c ^ d, a, b, x, s, t);
}

function md5_ii(a, b, c, d, x, s, t) {
  return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
}

function safe_add(x, y) {
  const lsw = (x & 0xFFFF) + (y & 0xFFFF);
  const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

function bit_rol(num, cnt) {
  return (num << cnt) | (num >>> (32 - cnt));
}

function str2binl(str) {
  const bin = [];
  const mask = (1 << chrsz) - 1;
  for (let i = 0; i < str.length * chrsz; i += chrsz) {
    bin[i >> 5] |= (str.charCodeAt(i / chrsz) & mask) << (i % 32);
  }
  return bin;
}

function binl2str(bin) {
  let str = '';
  const mask = (1 << chrsz) - 1;
  for (let i = 0; i < bin.length * 32; i += chrsz) {
    str += String.fromCharCode((bin[i >> 5] >>> (i % 32)) & mask);
  }
  return str;
}

const guid = (function() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
  }
  return function() {
    return s4() + s4() + s4() + s4() + s4() + s4() + s4() + s4();
  };
})();

function constructMetaData(accessId, postPolicy, signature) {
  const metadata = {
    "key": "upload/" + guid() + "/somefile.jar",
    "acl": "private",
    "Content-Type": "application/octet-stream",
    "AWSAccessKeyId": accessId,
    "policy": postPolicy,
    "signature": signature,
    "x-amz-meta-mailaddress": email,
    "x-amz-meta-scanlabel": "somefile.jar;" + githubactions,
    "x-amz-meta-password": md5crypt(password, randomize_md5_salt()),
    "success_action_redirect": "https://www.sonatype.com/nvs-cloud-thank-you"
  };

  let data = "";
  for (let i in metadata) {
    if ({}.hasOwnProperty.call(metadata, i)) {
      data += "--" + boundary + "\r\n";
      data += "Content-Disposition: form-data; name=\"" + i + "\"; \r\n\r\n" + metadata[i] + "\r\n";
    }
  }

  return data;
}

function constructFileContentPart() {
  let data = "--" + boundary + "\r\n";
  data += "Content-Disposition: form-data; name=\"file\"; filename=\"" + filePath + "\"\r\n";
  data += "Content-Type:application/octet-stream\r\n\r\n";
  return data;
}

function constructBodyForPostRequest(fileContent, accessId, postPolicy, signature) {
  const data = constructMetaData(accessId, postPolicy, signature) + constructFileContentPart();

  return  Buffer.concat([
    Buffer.from(data, "utf8"),
    Buffer.from(fileContent, "binary"),
    Buffer.from("\r\n--" + boundary + "--\r\n", "utf8")
  ]);
}

function uploadFileToS3(accessId, postPolicy, signature) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      console.error();
      return;
    }

    const payload = constructBodyForPostRequest(content, accessId, postPolicy, signature);

    const options = {
      method: 'POST',
      hostname: hostname,
      path: path,
      port: 443,
      headers: {
        "Content-Type": "multipart/form-data; boundary=" + boundary,
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

//---------------------------------------------------------------------------------
//---------------------- Actual POST request to upload file into S3 bucket---------
//---------------------------------------------------------------------------------

http.get(policy, (resp) => {
  let data = "";

  resp.on('data', (chunk) => {
    data += chunk;
  });

  resp.on('end', () => {
    const result = JSON.parse(data);
    console.log("================ Get request result ================");
    console.log(result);
    console.log("====================================================");

    uploadFileToS3(result.accessId, result.postPolicy, result.signature);
  });

}).on("error", (err) => {
  console.log("Error: " + err.message);
});
