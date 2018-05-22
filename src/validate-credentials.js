const fs = require('fs')

/**
 * Validate username and password.
 * @param {string} username
 * @param {string} password
 * @param {string} userStoreFilePath path to user-store file
 * @returns {Promise}
 */
function validateFileBasedCredentials (username, password, userStoreFilePath) {
  const promise = new Promise((resolve, reject) => {
    fs.readFile(userStoreFilePath, function (err, dataBuffer) {
      if (err) return reject(err)

      let userStore = JSON.parse(dataBuffer.toString())

      const user = userStore.find(user => {
        return user.username === username
      })

      if (!user || user.password !== password) {
        resolve(false)
      }
      resolve(true)
    })
  })
  return promise
}

module.exports = validateFileBasedCredentials
