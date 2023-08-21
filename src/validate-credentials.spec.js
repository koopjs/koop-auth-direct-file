const fs = require('fs-extra');
const { validateCredentials } = require('./validate-credentials');

jest.spyOn(fs, 'readFile');

describe('validate credentials', () => {
  test('should validate', async () => {
    fs.readFile.mockImplementationOnce(() => {
      return Buffer.from(JSON.stringify([
        { username: 'foo', 'password': 'bar' }
      ]));
    });

    const result = await validateCredentials('foo', 'bar');
    expect(result).toEqual(true);
  });

  test('should throw error reading store', async () => {
    fs.readFile.mockImplementationOnce(() => {
      throw new Error('file error');
    });

    try {
      await validateCredentials('foo', 'bar');
    } catch (err) {
      expect(err.message).toEqual('Auth plugin: error reading auth store');
    }    
  });
});
