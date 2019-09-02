const assert = require('assert');
const bjguahao = require('..');
const test = require('./test');

const { MOBILE_NO, PASSWORD } = process.env;

const payload = {
  hospitalId: 1,
  departmentId: 200004023,
  dutyCode: 1,
  dutyDate: '2019-09-02'
};

(async () => {

  var session;

  await test('bjguahao#login', async () => {
    session = await bjguahao.login(MOBILE_NO, PASSWORD);
    assert.equal(session.indexOf('JSESSIONID='), 0);
    assert.notEqual(session.indexOf('SESSION_COOKIE='), -1);
  });

  await test('bjguahao#calendar', async () => {
    const calendar = await bjguahao.calendar(payload);
    assert.equal(calendar.code, 1);
    assert.equal(calendar.todayDate, payload.dutyDate);
  });

  await test('bjguahao#doctors', async () => {
    const doctors = await bjguahao.doctors(session, payload);
    assert.ok(Array.isArray(doctors));
  
    const doctor = doctors[0];

    assert.equal(doctor.hospitalId, 1);
    assert.equal(doctor.departmentId, 200004023);

    payload.doctorId = doctor.doctorId;
    payload.dutySourceId = doctor.dutySourceId;
  });

  await test('bjguahao#patients', async () => {
    const patients = await bjguahao.patients(session, payload);
    assert.ok(Array.isArray(patients));
    const patient = patients[0];
    assert.ok(patient.id);
    assert.ok(patient.name);
    assert.ok(patient.phone);
    assert.ok(patient.code);

    payload.patientId = patient.id;
    payload.phone = patient.phone;

  });

  await test('bjguahao#code', async () => {
    const result = await bjguahao.code(session, payload.phone);
    assert.equal(result.code, 200, result.msg);
  });

})();