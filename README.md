# Koop-Auth-Direct-File
## A authentication module for implementing direct authentication from client to Koop server with a file-based user-store

[![npm][npm-image]][npm-url]  
[![travis][travis-image]][travis-url]  
[![Greenkeeper badge][greenkeeper-image]][greenkeeper-url]  

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
| options.useHttp | <code>boolean</code> | pass the `useHttp` boolean flag as part of the authenticationSpecification function result|

## Special considerations for use with [koop-output-geoservices](https://github.com/koopjs/koop-output-geoservices)
[koop-output-geoservices](https://github.com/koopjs/koop-output-geoservices) assumes that token-services occur over HTTPS.  For development purposes you may wish to allow authentication to occur of HTTP.  This can be done two different ways.  You can add the `useHttp` option when configuring the module, which will be passed on in the result of `authenticationSpecification()` calls.

    let auth = require('@koopjs/auth-direct-file')('pass-in-your-secret', `${__dirname}/user-store.json`, { useHttp: true })
    koop.register(auth)

Alternatively, you can set an environment variable `KOOP_AUTH_HTTP=true`.  Either of these approaches inform [koop-output-geoservices](https://github.com/koopjs/koop-output-geoservices) to use `http` as the protocol of the `tokenServicesUrl`.

## Notes on use with ArcGIS Online and ArcGIS Portal  
This authorization plugin has been tested with ArcGIS Online and ArcGIS Portal.  For versions of Portal earlier than 10.6, you may need to [import the root of your certificate into Portal's trust store](http://enterprise.arcgis.com/en/portal/10.5/administer/linux/import-a-certificate-into-the-portal.htm). We have observed the inability to store credentials for a secured Koop service on Portal instances that have not yet imported the root SSL certificate (of the Koop instance) into the trust-store.

[npm-image]: https://img.shields.io/npm/v/@koopjs/auth-direct-file.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/@koopjs/auth-direct-file
[travis-image]: https://travis-ci.org/koopjs/koop-auth-direct-file.svg?style=flat-square
[travis-url]: https://travis-ci.org/koopjs/koop-auth-direct-file
[greenkeeper-image]: https://badges.greenkeeper.io/koopjs/koop-auth-direct-file.svg
[greenkeeper-url]: https://greenkeeper.io/
