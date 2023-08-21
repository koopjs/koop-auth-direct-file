const fs = require('fs-extra');

/**
 * Validate username and password.
 * @param {string} username
 * @param {string} password
 * @param {string} userStoreFilePath path to user-store file
 * @returns {Promise}
 */
async function validateCredentials(username, password, userStoreFilePath) {
  try {
    const dataBuffer = await fs.readFile(userStoreFilePath);
    const userStore = JSON.parse(dataBuffer.toString());

    const user = userStore.find((user) => {
      return user.username === username;
    });
  
    return user?.password === password;
  } catch (err) {
    throw new Error('Auth plugin: error reading auth store');
  }
}

module.exports = {
  validateCredentials,
};
