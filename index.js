const http = require('http');
const assert = require('assert');
const crypto = require('crypto-js');
const qs = require('querystring');

const ERROR_CODES = {
  812: '短信发送太频繁',
  817: '抱歉，短信验证码发送次数已达到今日上限！',
  7001: '短信验证码错误!',
  8010: '号源不足！',
  8019: '超过停挂时间！',
};

const request = (method, url, payload, headers) => {
  return new Promise((resolve, reject) => {
    const req = http.request(url, {
      method,
      headers,
    }, resolve);
    req.once('error', reject);
    req.end(qs.stringify(payload));
  });
};

const get = (url, headers) =>
  request('get', url, {}, headers);

const post = (url, payload, headers) =>
  request('post', url, payload, Object.assign({
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
  }, headers));

const readStream = stream => {
  const buffer = [];
  return new Promise((resolve, reject) => {
    stream
      .on('error', reject)
      .on('data', chunk => buffer.push(chunk))
      .on('end', () => resolve(Buffer.concat(buffer)))
  });
};

const handleError = res => {
  assert.equal(res.code, 200, res.msg);
  assert.notEqual(res.hasError, true, res.msg);
  return res.data || res;
};

const ensureStatusCode = expected => res => {
  const { statusCode } = res;
  assert.equal(statusCode, expected, `status code must be "${expected}" but actually "${statusCode}"`);
  return res;
};

const encrypt = str => {
  var key = crypto.enc.Utf8.parse("hyde2019hyde2019");
  const data = crypto.enc.Utf8.parse(str);
  const encrypted = crypto.AES.encrypt(data, key, {
    mode: crypto.mode.ECB, 
    padding: crypto.pad.Pkcs7
  });
  return encrypted.toString();
};

const login = (mobileNo, password) => {
  const payload = {
    mobileNo: encrypt(mobileNo),
    password: encrypt(password),
    loginType: 'PASSWORD_LOGIN',
  };
  var cookie = '';
  return Promise
    .resolve()
    .then(() => post(`${bjguahao.api}/web/login/doLogin.htm`, payload, {  }))
    .then(ensureStatusCode(200))
    .then(res => {
      cookie = res.headers['set-cookie'];
      return res;
    })
    .then(readStream)
    .then(JSON.parse)
    .then(body => {
      assert.equal(body.code, 0, body.msg);
      return body;
    })
    .then(() => cookie.map(x => x.split(/;\s?/)[0]))
    .then(cookies => cookies.join('; '))
}

const getDoctors = (cookie, payload) => {
  return Promise
    .resolve()
    .then(() => post(`${bjguahao.api}/dpt/partduty.htm`, payload, { cookie }))
    .then(ensureStatusCode(200))
    .then(readStream)
    .then(JSON.parse)
    .then(handleError)
};

const getPatients = (cookie, payload) => {
  const { hospitalId, departmentId, doctorId, dutySourceId } = payload;
  // @example http://www.114yygh.com/order/confirm/1-200004023-201157622-64787916.htm
  const doctorURL = `${bjguahao.api}/order/confirm/${hospitalId}-${departmentId}-${doctorId}-${dutySourceId}.htm`
  return Promise
    .resolve()
    .then(() => get(doctorURL, { cookie }))
    .then(ensureStatusCode(200))
    .then(readStream)
    .then(body => body.toString())
    .then(html => {
      const m = html.match(/<div class="personnel(.+)<\/p><\/div><\/div>/g);
      if(!m) return console.error(doctorURL);
      return m.map(x => {
        const id = x.match(/name="(\d+)"/)[1];
        const name = x.match(/<p class="name">(.+)<\/p><p/)[1];
        const phone = x.match(/phone="(\d+)"/)[1];
        const tail = x.match(/<p class="code"><b>身份证<\/b>\*+(.+)<\/p><\/div><\/div>$/)[1];
        return { id, name, phone, tail };
      });
    })
};

const code = (cookie, mobileNo) => {
  const payload = {
    mobileNo,
    smsType: 4,
  };
  return Promise
    .resolve()
    .then(() => post(`${bjguahao.api}/v/sendSmsCode.htm`, payload, { cookie }))
    .then(ensureStatusCode(200))
    .then(readStream)
    .then(JSON.parse)
    .then(handleError)
};

const bjguahao = async (cookie, payload) => {
  return Promise
    .resolve()
    .then(() => post(`${bjguahao.api}/order/confirmV1.htm`, payload, { cookie }))
    .then(ensureStatusCode(200))
    .then(readStream)
    .then(JSON.parse)
    .then(handleError)
};

bjguahao.code = code;
bjguahao.login = login;
bjguahao.request = request;
bjguahao.doctors = getDoctors;
bjguahao.patients = getPatients;
bjguahao.api = 'http://www.114yygh.com';

module.exports = bjguahao;