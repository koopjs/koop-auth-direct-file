const test = require('tape')
const path = require('path')
const jwt = require('jsonwebtoken')
const providerMock = {
  name: 'test-provider',
  Model: function () {}
}
const secret = 'secret'
const auth = require('../src')(secret, path.join(__dirname, '/fixtures/user-store.json'))

test('authorize success with token as query parameter', async function (t) {
  t.plan(1)
  // Mock token
  const token = jwt.sign({exp: Math.floor(Date.now() / 1000) + 120, iss: providerMock.name, sub: 'username'}, secret)
  let decoded = await auth.authorize({ query: { token } })
  t.equals(decoded.iss, providerMock.name)
})

test('authorize success with token as authorization header', async function (t) {
  t.plan(1)
  // Mock token
  const token = jwt.sign({exp: Math.floor(Date.now() / 1000) + 120, iss: providerMock.name, sub: 'username'}, secret)
  let decoded = await auth.authorize({ headers: { authorization: token } })
  t.equals(decoded.iss, providerMock.name)
})

test('authorize failure - no token', async function (t) {
  t.plan(1)
  try {
    await auth.authorize(undefined)
  } catch (err) {
    t.equals(err.code, 401)
  }
})

test('authorize failure - expired token', async function (t) {
  t.plan(1)
  // Mock token
  const token = jwt.sign({exp: Math.floor(Date.now() / 1000) - 120, iss: providerMock.name, sub: 'username'}, secret)
  try {
    await auth.authorize({ query: { token } })
  } catch (err) {
    t.equals(err.code, 401)
  }
})

test('authenticate success', async function (t) {
  t.plan(2)
  let result = await auth.authenticate({ query: { username: 'jerry', password: 'garcia' } })
  t.equals(typeof result.token, 'string')
  t.equals(typeof result.expires, 'number')
})

test('authenticate failure - missing username', async function (t) {
  t.plan(2)
  try {
    await auth.authenticate({ query: { password: 'garcia' } })
  } catch (err) {
    t.equals(err.code, 401)
    t.equals(err.message, 'Invalid credentials.')
  }
})

test('authenticate failure - missing password', async function (t) {
  t.plan(2)
  try {
    await auth.authenticate({ query: { username: 'jerry' } })
  } catch (err) {
    t.equals(err.code, 401)
    t.equals(err.message, 'Invalid credentials.')
  }
})

test('authenticate failure', async function (t) {
  t.plan(2)
  try {
    await auth.authenticate({ query: { username: 'lou', password: 'reed' } })
  } catch (err) {
    t.equals(err.code, 401)
    t.equals(err.message, 'Invalid credentials.')
  }
})

test('authenticationSpecifiction', t => {
  t.plan(1)
  let result = auth.authenticationSpecification()
  t.equals(result.useHttp, false)
})

test('authSpecOptions - useHttp: true', t => {
  t.plan(1)
  let optionAuth = require('../src')(secret, path.join(__dirname, '/fixtures/user-store.json'), {useHttp: true})
  let result = optionAuth.authenticationSpecification()
  t.equals(result.useHttp, true)
})

test('authSpecOptions - useHttp: false', t => {
  t.plan(1)
  let optionAuth = require('../src')(secret, path.join(__dirname, '/fixtures/user-store.json'), {useHttp: false})
  let result = optionAuth.authenticationSpecification()
  t.equals(result.useHttp, false)
})

test('tokenExpirationMinutes - invalid "tokenExpirationMinutes" setting', t => {
  t.plan(1)
  t.throws(function () {
    require('../src')(secret, path.join(__dirname, '/fixtures/user-store.json'), {tokenExpirationMinutes: -1})
  }, /"tokenExpirationMinutes" must be an integer >= 5/)
})

test('tokenExpirationMinutes - invalid "useHttp" setting', t => {
  t.plan(1)
  t.throws(function () {
    require('../src')(secret, path.join(__dirname, '/fixtures/user-store.json'), {useHttp: 'string-value'})
  }, /"useHttp" must be a boolean/)
})
