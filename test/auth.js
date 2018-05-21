const test = require('tape')
const jwt = require('jsonwebtoken')
const proxyquire = require('proxyquire')
const auth = require('../src')

const providerMock = {
  name: 'test-provider',
  Model: function () {}
}
const secret = 'secret'
const userStore = [{ 'username': 'jerry', 'password': 'garcia' }]
const validateCredentials = proxyquire('./fixtures/identity-management', {'./user-store': userStore})
auth(providerMock, secret, validateCredentials)

test('authorize success', async function (t) {
  t.plan(1)
  // Mock token
  const token = jwt.sign({exp: Math.floor(Date.now() / 1000) + 120, iss: providerMock.name, sub: 'username'}, secret)
  let decoded = await providerMock.Model.prototype.authorize(token)
  t.equals(decoded.iss, providerMock.name)
})

test('authorize failure - no token', async function (t) {
  t.plan(1)
  try {
    await providerMock.Model.prototype.authorize(undefined)
  } catch (err) {
    t.equals(err.code, 401)
  }
})

test('authorize failure - expired token', async function (t) {
  t.plan(1)
  // Mock token
  const token = jwt.sign({exp: Math.floor(Date.now() / 1000) - 120, iss: providerMock.name, sub: 'username'}, secret)
  try {
    await providerMock.Model.prototype.authorize(token)
  } catch (err) {
    t.equals(err.code, 401)
  }
})

test('authenticate success', async function (t) {
  t.plan(2)
  let result = await providerMock.Model.prototype.authenticate('jerry', 'garcia')
  t.equals(typeof result.token, 'string')
  t.equals(typeof result.expires, 'number')
})

test('authenticate failure', async function (t) {
  t.plan(2)
  try {
    await providerMock.Model.prototype.authenticate('lou', 'reed')
  } catch (err) {
    t.equals(err.code, 401)
    t.equals(err.message, 'Invalid credentials.')
  }
})

test('authenticationSpecifiction', t => {
  t.plan(2)
  let result = providerMock.Model.prototype.authenticationSpecification()
  t.equals(result.secured, true)
  t.equals(result.provider, providerMock.name)
})

test('tokenExpirationMinutes - invalid setting', t => {
  t.plan(1)
  t.throws(function () {
    auth({name: 'test', Model: function () {}}, secret, validateCredentials, {tokenExpirationMinutes: -1})
  }, /"tokenExpirationMinutes" must be an integer >= 5/)
})
