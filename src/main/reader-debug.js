

export function dec(codeStr) {
    var baseCode =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    // bitcake 编码数组
    var _tbl = {};
    // bitcake 解码表
    for (var i = 0; i < 64; ++i) {
        _tbl[baseCode.charAt(i)] = i;
    }
    
    var _pad = baseCode.charAt(64);

    var ret = [],
      one,
      two,
      three,
      four,
      k = 0,
      m = 0;
    codeStr = codeStr.replace(/[^0-9A-Za-z+\/=]/g, "");
    // 清空掉所有不在范围内的字符
    while (k < codeStr.length) {
      one = _tbl[codeStr.charAt(k++)];
      two = _tbl[codeStr.charAt(k++)];
      three = _tbl[codeStr.charAt(k++)];
      four = _tbl[codeStr.charAt(k++)];
      ret[m++] = (one << 2) | (two >> 4);
      ret[m++] = ((two & 15) << 4) | (three >> 2);
      ret[m++] = ((three & 3) << 6) | four;
    }
    var j = codeStr.slice(-2);
    if (j.charAt(0) === _pad) {
      ret.length = ret.length - 2;
    } else {
      if (j.charAt(1) === _pad) {
        ret.length = ret.length - 1;
      }
    }
    return utf8to16(ret);
  }

 function utf8to16(strArr) {
    var out = [],
      len = strArr.length,
      i = 0,
      cur,
      char2,
      char3;
    while (i < len) {
      cur = strArr[i++];
      switch (cur >> 4) {
        case 0:
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
          // 0xxxxxxx
          out[i] = String.fromCharCode(strArr[i - 1]);
          break;

        case 12:
        case 13:
          // 110x xxxx   10xx xxxx
          char2 = strArr[i];
          out[i] = String.fromCharCode(((cur & 31) << 6) | (char2 & 63));
          break;

        case 14:
          // 1110 xxxx  10xx xxxx  10xx xxxx
          char2 = strArr[i];
          char3 = strArr[i + 1];
          out[i] = String.fromCharCode(
            ((cur & 15) << 12) | ((char2 & 63) << 6) | ((char3 & 63) << 0)
          );
          break;
      }
    }
    return out.join("");
  }