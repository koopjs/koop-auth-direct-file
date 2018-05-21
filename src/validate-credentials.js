const fs = require('fs')
const userStoreFilePath = process.env.USER_STORE

/**
 * Validate username and password.
 * @param {string} username
 * @param {string} password
 * @returns {Promise}
 */
function validateFileBasedCredentials (username, password) {
  const promise = new Promise((resolve, reject) => {
    fs.readFile(`${__dirname}/../${userStoreFilePath}`, function (err, dataBuffer) {
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
