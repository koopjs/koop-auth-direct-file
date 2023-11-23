const fs = require('fs');
const jwt = require('jsonwebtoken');
const joi = require('joi');
const { validateCredentials } = require('./validate-credentials');
const TOKEN_EXPIRATION_MINUTES = 60;

const optionsSchema = joi.object({
  tokenExpirationMinutes: joi
    .number()
    .integer()
    .greater(4)
    .default(TOKEN_EXPIRATION_MINUTES),
}).unknown();

let _tokenExpirationMinutes;
let _secret;
let _userStoreFilePath;

/**
 * configure auth functions
 * @param {string}   secret - secret for generating tokens
 * @param {string}   userStoreFilePath - file path of user store JSON file
 * @param {object}   options
 * @param {integer}  options.tokenExpirationMinutes - number of minutes until token expires
 */
function initAuthPlugin(secret, userStoreFilePath, options = {}) {
  // Throw error if user-store file does not exist
  const result = fs.existsSync(userStoreFilePath);
  if (!result) {
    throw new Error(`${userStoreFilePath} not found`);
  }
  _secret = secret;
  _userStoreFilePath = userStoreFilePath;

  const {
    error,
    value: { tokenExpirationMinutes },
  } = optionsSchema.validate(options);

  if (error) {
    throw new Error(error.details[0].message);
  }

  _tokenExpirationMinutes = tokenExpirationMinutes;

  return {
    type: 'auth',
    authenticate,
    authorize,
    name: 'file-based-auth-store',
    version: require('../package.json').version
  };
}


/**
 * Authenticate a user's submitted credentials
 * @param {object} req Express request object
 * @returns {Promise}
 */
async function authenticate(req) {
  const expires = Date.now() + _tokenExpirationMinutes * 60 * 1000;
  const { query = {}, body = {} } = req;
  const { username, password, token } = { ...query, ...body };

  if (token) {
    const { sub } = decodeToken(token);
    return {
      token: createToken(sub, expires),
      expires,
    };
  }

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
  
  return {
    token: createToken(username, expires),
    expires,
  };
}

/**
 * Validate a token
 * @param {object} req Express request object
 * @returns {Promise}
 */
async function authorize(req) {
  const { query = {}, body = {} } = req;
  const headerToken = req.headers['authorization'] ?? req.headers['authorization'].replace(/^Bearer /, '');
  const params = { ...query, ...body };
  const token = headerToken || params.token;

  if (!token) {
    let err = new Error('No authorization token.');
    err.code = 401;
    throw err;
  }
  // Verify token with async decoded function
  return decodeToken(token);
}

async function decodeToken(token) {
  try {
    const decoded = await jwt.verify(token, _secret);
    return decoded;
  } catch (err) {
    err.code = 401;
    throw err;
  }
}

function createToken(sub, expires) {
  return jwt.sign({ exp: Math.floor(expires / 1000), sub }, _secret);
}

module.exports = initAuthPlugin;
