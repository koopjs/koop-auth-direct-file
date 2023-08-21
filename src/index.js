const fs = require('fs');
const jwt = require('jsonwebtoken');
const joi = require('joi');
const { validateCredentials } = require('./validate-credentials');
const errorPrefix = 'Auth plugin: ';
const TOKEN_EXPIRATION_MINUTES = 60;

const optionsSchema = joi.object({
  useHttp: joi.boolean().default(false),
  tokenExpirationMinutes: joi
    .number()
    .integer()
    .greater(4)
    .default(TOKEN_EXPIRATION_MINUTES),
});

let _useHttp;
let _tokenExpirationMinutes;
let _secret;
let _userStoreFilePath;

/**
 * configure auth functions
 * @param {string}   secret - secret for generating tokens
 * @param {string}   userStoreFilePath - file path of user store JSON file
 * @param {object}   options
 * @param {integer}  options.tokenExpirationMinutes - number of minutes until token expires
 * @param {boolean}  options.useHttp - direct consumers of authenticationSpecifcation to use HTTP instead of HTTPS
 */
function initAuthPlugin(secret, userStoreFilePath, options = {}) {
  // Throw error if user-store file does not exist
  const result = fs.existsSync(userStoreFilePath);
  if (!result) {
    throw new Error(`${errorPrefix}${userStoreFilePath} not found`);
  }
  _secret = secret;
  _userStoreFilePath = userStoreFilePath;

  const {
    error,
    value: { tokenExpirationMinutes, useHttp },
  } = optionsSchema.validate(options);

  if (error) {
    throw new Error(`${errorPrefix}${error.details[0].message}`);
  }

  _useHttp = useHttp;
  _tokenExpirationMinutes = tokenExpirationMinutes;

  return {
    type: 'auth',
    authenticationSpecification,
    authenticate,
    authorize,
  };
}

/**
 * Return "authenticationSpecification" object for use in output-services
 * @returns {object}
 */
function authenticationSpecification() {
  return {
    useHttp: _useHttp,
  };
}

/**
 * Authenticate a user's submitted credentials
 * @param {object} req Express request object
 * @returns {Promise}
 */
async function authenticate(req) {
  const username = req.query?.username;
  const password = req.query?.password;

  // Validate user's credentials
  const valid = await validateCredentials(
    username,
    password,
    _userStoreFilePath,
  );

  if (!valid) {
    let err = new Error('Invalid credentials.');
    err.code = 401;
    throw err;
  }

  // Create access token and wrap in response object
  const expires = Date.now() + _tokenExpirationMinutes * 60 * 1000;
  return {
    token: jwt.sign(
      { exp: Math.floor(expires / 1000), sub: username },
      _secret,
    ),
    expires,
  };
}

/**
 * Validate a token
 * @param {object} req Express request object
 * @returns {Promise}
 */
async function authorize(req) {
  let token = req.query?.token || req.headers['authorization'];

  if (!token) {
    let err = new Error('No authorization token.');
    err.code = 401;
    throw err;
  }
  // Verify token with async decoded function
  try {
    const decoded = await jwt.verify(token, _secret);
    return decoded;
  } catch (err) {
    err.code = 401;
    throw err;
  }
}

module.exports = initAuthPlugin;
