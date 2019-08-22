const http = require('http');
const assert = require('assert');
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

const base64 = str => 
  Buffer.from(str).toString('base64');

const login = (mobileNo, password) => {
  const payload = {
    mobileNo: base64(mobileNo),
    password: base64(password),
    yzm: '',
  };
  var cookie = '';
  return Promise
    .resolve()
    .then(() => post(`${bjguahao.api}/quicklogin.htm`, payload))
    .then(res => {
      assert.equal(res.statusCode, 200);
      cookie = res.headers['set-cookie'];
      return res;
    })
    .then(readStream)
    .then(JSON.parse)
    .then(handleError)
    .then(() => cookie.map(x => x.split(/;\s?/)[0]))
    .then(cookies => cookies.join('; '))
}

const getDoctors = (cookie, payload) => {
  return Promise
    .resolve()
    .then(() => post(`${bjguahao.api}/dpt/partduty.htm`, payload, { cookie }))
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
    .then(res => {
      assert.equal(res.statusCode, 200);
      return res;
    })
    .then(readStream)
    .then(body => body.toString())
    .then(html => {
      const m = html.match(/<div class="personnel(.+)<\/span><\/div><\/div>/g);
      const patients = m.map(x => {
        const id = x.match(/name="(\d+)"/)[1];
        const name = x.match(/<span class="name">(.+)<\/span><span/)[1];
        const tail = x.match(/<span class="code">\*+(.+)<\/span><\/div><\/div>$/)[1];
        return { id, name, tail };
      });
      return patients;
    })
};

const code = cookie => {
  return Promise
    .resolve()
    .then(() => post(`http://www.114yygh.com/v/sendorder.htm`, {}, { cookie }))
    .then(readStream)
    .then(JSON.parse)
    .then(handleError)
};

const bjguahao = async (cookie, payload) => {
  return Promise
    .resolve()
    .then(() => post(`${bjguahao.api}/order/confirmV1.htm`, payload, { cookie }))
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