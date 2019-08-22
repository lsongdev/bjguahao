## bjguahao

> 北京市预约挂号统一平台

[![bjguahao](https://img.shields.io/npm/v/bjguahao.svg)](https://npmjs.org/bjguahao)

### Installation

```bash
$ npm install bjguahao
```

### Example

```js
const bjguahao = require('bjguahao');

const input = prompt => new Promise((resolve, reject) => {
  process.stdout.write(prompt + ' ');
  process.stdin
    .once('error', reject)
    .once('data', line => resolve(`${line}`.trim()));
});

(async () => {

  const mobile = await input('username:');;
  const password = await input('password:');
  const session = await bjguahao.login(mobile, password);

  const payload = {
    hospitalId: 1,
    departmentId: 200004023,
    dutyCode: 1,
    dutyDate: '2019-08-22'
  };

  const doctors = await bjguahao.doctors(session, payload);
  console.log(' doctors');
  doctors.forEach(doctor => {
    console.log(` - ${doctor.doctorName}(${doctor.doctorTitleName}) ${doctor.skill}`);
  });
  console.log();

  const doctor = doctors[0];
  payload.doctorId = doctor.doctorId;
  payload.dutySourceId = doctor.dutySourceId;
  const patients = await bjguahao.patients(session, payload);
  console.log(' patients');
  patients.forEach(patient => {
    console.log(` - ${patient.name}(${patient.tail})`);
  });
  console.log();

  const result = await bjguahao.code(session);
  console.log(result);

  payload.patientId = patients[0].id;
  payload.smsVerifyCode = await input('verify code:');
  const output = await bjguahao(session, payload);
  console.log(output);

})();

```

### Contributing
- Fork this Repo first
- Clone your Repo
- Install dependencies by `$ npm install`
- Checkout a feature branch
- Feel free to add your features
- Make sure your features are fully tested
- Publish your local branch, Open a pull request
- Enjoy hacking <3

### MIT

This work is licensed under the [MIT license](./LICENSE).

---