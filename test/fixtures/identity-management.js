const userStore = require('./user-store.json')

/**
 * Validate username and password. Replace the contents of this function to fit
 * your method of identity-management. This example made asynchronous with promise/callback
 * because most identity management solutions (DB or third-party call), will be async and require
 * promise or callback
 * @param {string} username
 * @param {string} password
 * @param {function} callback (optional) function to execute after completing credential validation
 * @returns {Promise}
 */
function validateInMemoryCredentials (username, password, callback) {
  const promise = new Promise((resolve, reject) => {
    process.nextTick(function () {
      const user = userStore.find(user => {
        return user.username === username
      })

      if (!user || user.password !== password) {
        resolve(false)
      }
      resolve(true)
    })
  })

  if (typeof callback === 'function') {
    promise.then(callback.bind(null, null), callback)
  }

  return promise
}

module.exports = validateInMemoryCredentials
