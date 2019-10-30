/*
 * Copyright (c) 2019-present Sonatype, Inc. All rights reserved.
 * Includes the third-party code listed at http://links.sonatype.com/products/nexus/attributions.
 * "Sonatype" is a trademark of Sonatype, Inc.
 */

export default class HashUtils {
  
  private static readonly ASCII64 = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  private static readonly CHRSZ = 8;

  static guid() {
    return HashUtils.s4() +
      HashUtils.s4() +
      HashUtils.s4() +
      HashUtils.s4() +
      HashUtils.s4() +
      HashUtils.s4() +
      HashUtils.s4() +
      HashUtils.s4();
  }
  
  static md5crypt(password: string, salt: string) {
    let ctx = password + '$apr1$' + salt;
    let ctx1 = HashUtils.str_md5(password + salt + password);
    
    /* "Just as many characters of ctx1" (as there are in the password) */
    for (let pl = password.length; pl > 0; pl -= 16) {
      ctx += ctx1.slice(0, (pl > 16) ? 16 : pl);
    }
    
    /* "Then something really weird" */
    for (let i = password.length; i !== 0; i >>= 1) {
      if (i & 1) {
        ctx += '\0';
      }
      else {
        ctx += password.charAt(0);
      }
    }
    
    ctx = HashUtils.str_md5(ctx);
    
    /* "Just to make sure things don't run too fast" */
    for (let i = 0; i < 1000; i++) {
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
      
      ctx = HashUtils.str_md5(ctx1);
    }
    
    return '$apr1$' + salt + '$' +
      HashUtils.to64_triplet(ctx, 0, 6, 12) +
      HashUtils.to64_triplet(ctx, 1, 7, 13) +
      HashUtils.to64_triplet(ctx, 2, 8, 14) +
      HashUtils.to64_triplet(ctx, 3, 9, 15) +
      HashUtils.to64_triplet(ctx, 4, 10, 5) +
      HashUtils.to64_single(ctx, 11);
  }
  
  static randomize_md5_salt() {
    return HashUtils.random_salt(8);
  }
  
  private static s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  
  private static random_salt(length: number): string {
    let salt = '';
    for (let i = 0; i < length; i++) {
      salt += HashUtils.ASCII64.charAt(Math.floor(64 * Math.random()));
    }
    return salt;
  }
  
  private static to64_triplet(str: string, idx0: number, idx1: number, idx2: number) {
    const v = (str.charCodeAt(idx0) << 16) |
      (str.charCodeAt(idx1) << 8) |
      (str.charCodeAt(idx2));
    return HashUtils.to64(v, 4);
  }
  
  private static to64_single(str: string, idx0: number) {
    const v = str.charCodeAt(idx0);
    return HashUtils.to64(v, 2);
  }
  
  private static to64(v: number, n: number) {
    let s = '';
    while (--n >= 0) {
      s += HashUtils.ASCII64.charAt(v & 0x3f);
      v >>= 6;
    }
    return s;
  }
  
  private static str_md5(s: string) {
    return HashUtils.binl2str(
      HashUtils.core_md5(
        HashUtils.str2binl(s), s.length * HashUtils.CHRSZ
      )
    );
  }
  
  private static str2binl(str: string): number[] {
    const bin: number[] = [];
    const mask = (1 << HashUtils.CHRSZ) - 1;
    for (let i = 0; i < str.length * HashUtils.CHRSZ; i += HashUtils.CHRSZ) {
      bin[i >> 5] |= (str.charCodeAt(i / HashUtils.CHRSZ) & mask) << (i % 32);
    }
    return bin;
  }
  
  private static binl2str(bin: number[]): string {
    let str = '';
    const mask = (1 << HashUtils.CHRSZ) - 1;
    for (let i = 0; i < bin.length * 32; i += HashUtils.CHRSZ) {
      str += String.fromCharCode((bin[i >> 5] >>> (i % 32)) & mask);
    }
    return str;
  }
  
  private static core_md5(x: number[], len: number) {
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
      
      a = HashUtils.md5_ff(a, b, c, d, x[i], 7, -680876936);
      d = HashUtils.md5_ff(d, a, b, c, x[i + 1], 12, -389564586);
      c = HashUtils.md5_ff(c, d, a, b, x[i + 2], 17, 606105819);
      b = HashUtils.md5_ff(b, c, d, a, x[i + 3], 22, -1044525330);
      a = HashUtils.md5_ff(a, b, c, d, x[i + 4], 7, -176418897);
      d = HashUtils.md5_ff(d, a, b, c, x[i + 5], 12, 1200080426);
      c = HashUtils.md5_ff(c, d, a, b, x[i + 6], 17, -1473231341);
      b = HashUtils.md5_ff(b, c, d, a, x[i + 7], 22, -45705983);
      a = HashUtils.md5_ff(a, b, c, d, x[i + 8], 7, 1770035416);
      d = HashUtils.md5_ff(d, a, b, c, x[i + 9], 12, -1958414417);
      c = HashUtils.md5_ff(c, d, a, b, x[i + 10], 17, -42063);
      b = HashUtils.md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
      a = HashUtils.md5_ff(a, b, c, d, x[i + 12], 7, 1804603682);
      d = HashUtils.md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
      c = HashUtils.md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
      b = HashUtils.md5_ff(b, c, d, a, x[i + 15], 22, 1236535329);
      
      a = HashUtils.md5_gg(a, b, c, d, x[i + 1], 5, -165796510);
      d = HashUtils.md5_gg(d, a, b, c, x[i + 6], 9, -1069501632);
      c = HashUtils.md5_gg(c, d, a, b, x[i + 11], 14, 643717713);
      b = HashUtils.md5_gg(b, c, d, a, x[i], 20, -373897302);
      a = HashUtils.md5_gg(a, b, c, d, x[i + 5], 5, -701558691);
      d = HashUtils.md5_gg(d, a, b, c, x[i + 10], 9, 38016083);
      c = HashUtils.md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
      b = HashUtils.md5_gg(b, c, d, a, x[i + 4], 20, -405537848);
      a = HashUtils.md5_gg(a, b, c, d, x[i + 9], 5, 568446438);
      d = HashUtils.md5_gg(d, a, b, c, x[i + 14], 9, -1019803690);
      c = HashUtils.md5_gg(c, d, a, b, x[i + 3], 14, -187363961);
      b = HashUtils.md5_gg(b, c, d, a, x[i + 8], 20, 1163531501);
      a = HashUtils.md5_gg(a, b, c, d, x[i + 13], 5, -1444681467);
      d = HashUtils.md5_gg(d, a, b, c, x[i + 2], 9, -51403784);
      c = HashUtils.md5_gg(c, d, a, b, x[i + 7], 14, 1735328473);
      b = HashUtils.md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);
      
      a = HashUtils.md5_hh(a, b, c, d, x[i + 5], 4, -378558);
      d = HashUtils.md5_hh(d, a, b, c, x[i + 8], 11, -2022574463);
      c = HashUtils.md5_hh(c, d, a, b, x[i + 11], 16, 1839030562);
      b = HashUtils.md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
      a = HashUtils.md5_hh(a, b, c, d, x[i + 1], 4, -1530992060);
      d = HashUtils.md5_hh(d, a, b, c, x[i + 4], 11, 1272893353);
      c = HashUtils.md5_hh(c, d, a, b, x[i + 7], 16, -155497632);
      b = HashUtils.md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
      a = HashUtils.md5_hh(a, b, c, d, x[i + 13], 4, 681279174);
      d = HashUtils.md5_hh(d, a, b, c, x[i], 11, -358537222);
      c = HashUtils.md5_hh(c, d, a, b, x[i + 3], 16, -722521979);
      b = HashUtils.md5_hh(b, c, d, a, x[i + 6], 23, 76029189);
      a = HashUtils.md5_hh(a, b, c, d, x[i + 9], 4, -640364487);
      d = HashUtils.md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
      c = HashUtils.md5_hh(c, d, a, b, x[i + 15], 16, 530742520);
      b = HashUtils.md5_hh(b, c, d, a, x[i + 2], 23, -995338651);
      
      a = HashUtils.md5_ii(a, b, c, d, x[i], 6, -198630844);
      d = HashUtils.md5_ii(d, a, b, c, x[i + 7], 10, 1126891415);
      c = HashUtils.md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
      b = HashUtils.md5_ii(b, c, d, a, x[i + 5], 21, -57434055);
      a = HashUtils.md5_ii(a, b, c, d, x[i + 12], 6, 1700485571);
      d = HashUtils.md5_ii(d, a, b, c, x[i + 3], 10, -1894986606);
      c = HashUtils.md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
      b = HashUtils.md5_ii(b, c, d, a, x[i + 1], 21, -2054922799);
      a = HashUtils.md5_ii(a, b, c, d, x[i + 8], 6, 1873313359);
      d = HashUtils.md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
      c = HashUtils.md5_ii(c, d, a, b, x[i + 6], 15, -1560198380);
      b = HashUtils.md5_ii(b, c, d, a, x[i + 13], 21, 1309151649);
      a = HashUtils.md5_ii(a, b, c, d, x[i + 4], 6, -145523070);
      d = HashUtils.md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
      c = HashUtils.md5_ii(c, d, a, b, x[i + 2], 15, 718787259);
      b = HashUtils.md5_ii(b, c, d, a, x[i + 9], 21, -343485551);
      
      a = HashUtils.safe_add(a, olda);
      b = HashUtils.safe_add(b, oldb);
      c = HashUtils.safe_add(c, oldc);
      d = HashUtils.safe_add(d, oldd);
    }
    return [a, b, c, d];
  }
  
  private static md5_cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
    return HashUtils.safe_add(
      HashUtils.bit_rol(HashUtils.safe_add(HashUtils.safe_add(a, q), HashUtils.safe_add(x, t)), s), b
    );
  }
  
  private static md5_ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return HashUtils.md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
  }
  
  private static md5_gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return HashUtils.md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
  }
  
  private static md5_hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return HashUtils.md5_cmn(b ^ c ^ d, a, b, x, s, t);
  }
  
  private static md5_ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
    return HashUtils.md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
  }
  
  private static safe_add(x: number, y: number) {
    const lsw = (x & 0xFFFF) + (y & 0xFFFF);
    const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return (msw << 16) | (lsw & 0xFFFF);
  }
  
  private static bit_rol(num: number, cnt: number) {
    return (num << cnt) | (num >>> (32 - cnt));
  }
}
