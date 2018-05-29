# Koop-Auth-Direct-File
## A authentication module for implementing direct authentication from client to Koop server with a file-based user-store

## Authentication pattern

The authentication module implemented here uses a *direct authentication* pattern; it receives user credentials (username/password) from a client and authenticates those credentials against an identity/user-store. Requests with valid credentials are issued an access-token (a string of encoded-data); The access token is encoded with the use of a secret known only to the Koop server. The access-token expires and becomes invalid after a certain period (default of 60 minutes).

![get access token](https://gist.githubusercontent.com/rgwozdz/e44f3686abe40360532fbcc6dccf225d/raw/9768df32fc62e99ce7383c124cab8efdf45b1e18/koop-direct-auth-access-token.png)

The issued access-token should be attached to all subsequent service requests by the client. When the server receives a request, it will check for the presence of an access-token and reject any requests that are missing such token. If the token is present, the server attempts to decode it with its stored secret. Failure to decode results in a request rejection. Once decoded, the server checks the token's expiration-date and rejects any token with a date that is out of range. If the token is not expired, the request for the desired resource proceeds.

![enter image description here](https://gist.githubusercontent.com/rgwozdz/e44f3686abe40360532fbcc6dccf225d/raw/9768df32fc62e99ce7383c124cab8efdf45b1e18/koop-direct-auth-resources.png)

## Example of Koop authentication implementation

The [server.js](./server.js) file provides an example of securing a provider's resources. Start by requiring the authentication module. Pass it a secret and the file path of your user-store.

    let auth = require('@koopjs/auth-direct-file')('pass-in-your-secret', `${__dirname}/user-store.json`)
    koop.register(auth)

Then require and register your providers.  

    const provider = require('./')
    koop.register(provider)

The authentication module will configure and add its `authorize`, `authenticate`, and `authenticationSpecification` functions to the provider's model prototype.  Output services will leverage these functions to secure the service endpoints and properly route requests to authenticate.

Finally, create a JSON file store.  This should be an array of objects with properties `username` and `password`.  Set an environment variable `USER_STORE` with the path of the file relative to the root of the repository (e.g, `USER_STORE=./user-store.json`)

## Authentication API

### (secret, options) ⇒ <code>Object</code>
* configure the authentication module with secret use for token encoding/decoding

| Param | Type | Description |
| --- | --- | --- |
| secret | <code>string</code> | secret for encoding/decoding tokens |
| userStoreFilePath | <code>string</code> | path to the JSON file containing the array of username/password objects |
| options | <code>object</code> | options object |
| options.tokenExpirationMinutes | <code>integer</code> | minutes until token expires (default 60) |
| options.authSpecExtension | <code>object</code> | additional key-value data to return in result of authenticationSpecification function |

## Extending the authentication-specification
The method `authenticationSpecification` returns simple information to the caller.  By default, this includes the `name` of the provider that is calling the method and a simple boolean property, `secured`, indicating that authentication/authorization is currently applied to the provider. For certain implementations, it may be important to add additional properties to the result of `authenticationSpecification()` and you can do that by adding the option `authSpecExtension` when configuring the module.  Its value should be an object literal.  For example, this implementation:  

    let auth = require('@koopjs/auth-direct-file')('pass-in-your-secret', `${__dirname}/user-store.json`, { authSpecExtention: { myNewProp: 'hello there' } })
    koop.register(auth)

would result in the following object being returned from `authenticationSpecification()`:  

    {
      name: 'my-provider',
      secured: true,
      myNewProp: 'hello there'
    }

## Special considerations for use with [koop-ouput-geoservices](https://github.com/koopjs/koop-output-geoservices)
[koop-ouput-geoservice](https://github.com/koopjs/koop-output-geoservices) geoservices assumes that token-services occur over HTTPS.  For development purposes you may wish to allow authentication to occur of HTTP.  This can be done by extending the `autheticationSpecification` result, as noted above, to include `ssl: false`:

    let auth = require('@koopjs/auth-direct-file')('pass-in-your-secret', `${__dirname}/user-store.json`, { authSpecExtention: { ssl: false } })
    koop.register(auth)

This addition will inform [koop-ouput-geoservices](https://github.com/koopjs/koop-output-geoservices) to use `http` as the protocol for its definition of the `tokenServicesUrl`.