const helpers = require('./validate-credentials');
const path = require('path');
const jwt = require('jsonwebtoken');
const secret = 'secret';

jest.spyOn(helpers, 'validateCredentials');
jest.spyOn(jwt, 'sign');
jest.spyOn(jwt, 'verify');

describe('Auth Plugin', () => {
  describe('initialize plugin', () => {
    test('should return expected registration object', () => {
      const authPlugin = require('./index.js')(
        secret,
        path.join(__dirname, '../test/fixtures/user-store.json'),
      );
      expect(authPlugin.type).toEqual('auth');
      expect(typeof authPlugin.authenticate).toBe('function');
    });

    test('should fail to initialize due to file not found', () => {
      try {
        require('./index.js')(
          secret,
          path.join(__dirname, '../test/fixtures/userz-store.json'),
        );
        fail('should have thrown');
      } catch (error) {
        expect(error.message).toMatch(
          /^Auth plugin: .+userz-store.json not found$/,
        );
      }
    });
  });

  describe('authenticate', () => {
    test('should fail to validate', async () => {
      const authPlugin = require('./index.js')(
        secret,
        path.join(__dirname, '../test/fixtures/user-store.json'),
      );

      try {
        await authPlugin.authenticate({
          query: { username: 'foo', password: 'bar' },
        });
        fail('should have thrown');
      } catch (error) {
        expect(error.message).toEqual('Invalid credentials.');
        expect(error.code).toEqual(401);
      }
    });

    test('should validate creds from query and send jwt', async () => {
      helpers.validateCredentials.mockImplementationOnce(() => {
        return true;
      });

      jwt.sign.mockImplementationOnce(() => {
        return 'abc';
      });

      const authPlugin = require('./index.js')(
        secret,
        path.join(__dirname, '../test/fixtures/user-store.json'),
      );

      const result = await authPlugin.authenticate({
        query: { username: 'foo', password: 'bar' },
      });

      expect(result.token).toEqual('abc');
      expect(result.expires).toBeGreaterThan(Date.now());
    });

    test('should validate creds from body and send jwt', async () => {
      helpers.validateCredentials.mockImplementationOnce(() => {
        return true;
      });

      jwt.sign.mockImplementationOnce(() => {
        return 'abc';
      });

      const authPlugin = require('./index.js')(
        secret,
        path.join(__dirname, '../test/fixtures/user-store.json'),
      );

      const result = await authPlugin.authenticate({
        body: { username: 'foo', password: 'bar' },
      });

      expect(result.token).toEqual('abc');
      expect(result.expires).toBeGreaterThan(Date.now());
    });
  });

  describe('authorize', () => {
    test('should fail to authorize due to missing token', async () => {
      const authPlugin = require('./index.js')(
        secret,
        path.join(__dirname, '../test/fixtures/user-store.json'),
      );

      try {
        await authPlugin.authorize({ query: {}, headers: [] });
        fail('should have thrown');
      } catch (error) {
        expect(error.message).toEqual('No authorization token.');
        expect(error.code).toEqual(401);
      }
    });

    test('should fail to authorize due to invalid token', async () => {
      jwt.verify.mockImplementationOnce(() => {
        throw new Error('failed to verify token');
      });

      const authPlugin = require('./index.js')(
        secret,
        path.join(__dirname, '../test/fixtures/user-store.json'),
      );

      try {
        await authPlugin.authorize({ query: { token: 'bar' } });
        fail('should have thrown');
      } catch (error) {
        expect(error.message).toEqual('failed to verify token');
        expect(error.code).toEqual(401);
      }
    });

    test('should authorize and send decoded jwt', async () => {
      jwt.verify.mockImplementationOnce(() => {
        return 'abc';
      });

      const expires = Date.now() + 5 * 60 * 1000;
      const token = jwt.sign(
        { exp: Math.floor(expires / 1000), sub: 'fezzik' },
        secret,
      );

      const authPlugin = require('./index.js')(
        secret,
        path.join(__dirname, '../test/fixtures/user-store.json'),
      );

      const result = await authPlugin.authorize({ query: { token } });

      expect(result).toEqual('abc');
    });
  });
});
