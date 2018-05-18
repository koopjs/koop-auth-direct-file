# Koop-Direct-Auth
## A module for implementing direct authentication from client to Koop server

This sample provider demonstrates the implementation of token-based security on services. The provider itself simply serves static GeoJSON files as Koop output-services. A more complete description of Koop and Koop providers is available at [koopjs.github.io](http://koopjs.github.io/).

## Authentication pattern

The authentication module implemented here uses a *direct authentication* pattern; it receives user credentials (username/password) from a client and authenticates those credentials against an identity/user-store. Requests with valid credentials are issued an access-token (a string of encoded-data); The access token is encoded with the use of a secret known only to the Koop server. The access-token expires and becomes invalid after a certain period (default of 60 minutes).

![get access token](https://gist.githubusercontent.com/rgwozdz/e44f3686abe40360532fbcc6dccf225d/raw/9768df32fc62e99ce7383c124cab8efdf45b1e18/koop-direct-auth-access-token.png)

The issued access-token should be attached to all subsequent service requests by the client. When the server receives a request, it will check for the presence of an access-token and reject any requests that are missing such token. If the token is present, the server attempts to decode it with its stored secret. Failure to decode results in a request rejection. Once decoded, the server checks the token's expiration-date and rejects any token with a date that is out of range. If the token is not expired, the request for the desired resource proceeds.

![enter image description here](https://gist.githubusercontent.com/rgwozdz/e44f3686abe40360532fbcc6dccf225d/raw/9768df32fc62e99ce7383c124cab8efdf45b1e18/koop-direct-auth-resources.png)

## Example of Koop authentication implementation

The [server.js](./server.js) file provides an example of securing a provider's resources. Start by requiring the provider and the authentication module.

    const provider = require('./')

    const auth = require('./koop-auth-direct')

You must author an function that authenticates user credentials.  See the specification below and look at the example [test/fixtures/identity-management.js](identity-management.js) in the `test/fixtures` directory.

    const validateCredentials = require('your-identity-module-here')

Supply the auth module with required parameters and use the ArcGIS online strategy to set options. Get back a configured middleware.

	auth(provider, <a-secret-for-encoding>, validateCredentials)

## Authentication API

### (provider, secret, validateCredentials, options) ⇒ <code>void</code>
* Decorates a provider's model with configured versions of the "validateToken", "authenticate" and "authenticationSpecification" functions

| Param | Type | Description |
| --- | --- | --- |
| provider | <code>object</code> | namespace of the provider to secure |
| provider.name | <code>string</code> | provider's namespace |
| provider.Model | <code>function</code> | provider's Model constructor |
| secret | <code>string</code> | secret for encoding/decoding tokens |
| validateCredentials | <code>function</code> | Identity management API method by which username and password are authenticated. Must return a Promise that resolves to boolean signaling validation|
| options | <code>object</code> | options object |
| options.tokenExpirationMinutes | <code>integer</code> | minutes until token expires (default 60) |


### Identity Management API

The direct authentication pattern supported here requires the use of an identity-management API to validate user credentials prior to issuance of an access-token. To provide the flexibility for implementations to use a variety of identity-management solutions, the authentication module requires a parameter that must be a function for validating credentials (see `validateCredentials` in the Authentication API). This method should have the following signature:

#### (username, password) ⇒ <code>Promise</code>

| Param | Type | Description |
| --- | --- | --- |
| username | <code>string</code> | username to validate |
| password | <code>string</code> | password associated the username | 

The promise should resolve to `true`/`false` for valid/invalid credentials. As long as the method conforms to the above requirements, developers are free to do identity management in any manner; for example, you may query a database for username, salt, and salted password, then validate. Or perhaps the username and password will be forwarded on to a cloud-based identity-management service.  See the example [test/fixtures/identity-management.js](identity-management.js) in the `test/fixtures` directory for a basic implementation that uses an in memory user-credentials store.

## Usage with ArcGIS clients

TBD