const jwt = require('jsonwebtoken')
const TOKEN_EXPIRATION_MINTUES = 60

/**
 * Generate authentication functions and decorate a provider's model with them
 * @param {object}   provider - provider that is getting secured
 * @param {string}   secret - secret for generating tokens
 * @param {function} validateCredentials - async function by which username and password are authenticated
 * @param {object}   options
 * @param {integer}  options.tokenExpirationMinutes - number of minutes until token expires
 */
function auth (provider, secret, validateCredentials, options = {}) {
  let tokenExpirationMinutes = options.tokenExpirationMinutes || TOKEN_EXPIRATION_MINTUES

  //  Ensure token expiration is an integer greater than 5
  if (!Number.isInteger(tokenExpirationMinutes) || tokenExpirationMinutes < 5) throw new Error(`"tokenExpirationMinutes" must be an integer >= 5`)

  // Get "authenticationSpecification" function with parameterization for this provider, and add to provider's model prototype
  provider.Model.prototype.authenticationSpecification = getAuthenticationSpecification(provider.name)

  // Get "authenticate" function with parameterization for this specific auth application
  provider.Model.prototype.authenticate = getAuthenticate(validateCredentials, provider.name, secret, tokenExpirationMinutes)

  // Get "authorized" function with parameterization for this specific auth application
  provider.Model.prototype.authorize = getAuthorize(secret)
}

/**
 * Parameterize a "authenticationSpecification" function with the name of a provider
 * @param {string} providerNamespace
 */
function getAuthenticationSpecification (providerNamespace) {
  return function authenticationSpecification () {
    return {
      provider: providerNamespace,
      secured: true
    }
  }
}

/**
 * Parameterize a "authenticate" function
 * @param {function} validateCredentials async function that validates username/password
 * @param {string} secret
 * @param {string} providerNamespace
 */
function getAuthenticate (validateCredentials, providerNamespace, secret, tokenExpirationMinutes) {
  return function authenticate (username, password) {
    return new Promise((resolve, reject) => {
      // Validate user's credentials
      validateCredentials(username, password)
        .then(valid => {
          // If credentials were not valid, reject
          if (!valid) {
            let err = new Error('Invalid credentials.')
            err.code = 401
            reject(err)// Create access token
          }
          let expires = Date.now() + (tokenExpirationMinutes * 60 * 1000)
          let json = {
            token: jwt.sign({exp: Math.floor(expires / 1000), iss: providerNamespace, sub: username}, secret),
            expires
          }
          resolve(json)
        })
        .catch(err => {
          reject(err)
        })
    })
  }
}

/**
 * Parameterize a "validateToken" function
 * @param {string} secret
 */
function getAuthorize (secret) {
  // Define validation function
  return function authorize (token) {
    return new Promise((resolve, reject) => {
      // Verify token with async decoded function
      jwt.verify(token, secret, function (err, decoded) {
        // If token invalid, reject
        if (err) {
          err.code = 401
          reject(err)
        }
        resolve(decoded)
      })
    })
  }
}

module.exports = auth
