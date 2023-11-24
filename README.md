# Koop-Auth-Direct-File
## A authentication module for implementing direct authentication from client to Koop server with a file-based user-store

[![npm][npm-image]][npm-url]  

## Usage

To use this plugin, you need to create a JSON file store.  This should be an array of objects with properties `username` and `password`.  See [user-store.json.example](user-store.json.example) as an example. Note, that this is a terrible way to store credentials!  This plugin is really just meant as an example of how to design a Koop authorization plugin and not meant for any production environment.

This module exports an initialization function that must be supplied with a secret-key and the path to the file that is the user-store.  It will return a plugin object that can be registered with Koop.

```javascript
    const authPlugin = require('@koopjs/auth-direct-file')('your-secret-key', `path/to/user-store.json`, { tokenExpirationMinutes: 300 })
    
    koop.register(auth)
```

### Registration order

For an auth-plugin to secure the data served by a provider, it must be registered _before_ the provider.  Any providers registered _after_ the auth-plugin will not have the plugin's authorization code applied.

```javascript
    const Koop = require('@koopjs/koop-core');
    const providerOne = require('koop-provider-one');
    const providerTwo = require('koop-provider-two');
    const authPlugin = require('@koopjs/auth-direct-file')('your-secret-key', `path/to/user-store.json`);

    const koop = new Koop();

    // providerOne, registered before auth-plugin, will be secured by auth-plugin methods
    koop.register(providerOne);

    koop.register(authPlugin);

    // providerTwo, registered after auth-plugin, will NOT be secured
    koop.register(providerTwo);

    const provider = require('./')
    koop.register(provider)
``` 

The underlying reason that order matter is because an auth-plugin add its `authorize` and `authenticate` functions to all _registered_ providers. (Note that providers may implement their own `authorize` and `authenticate` prototype methods, and if they do these will be used preferentially.) Output services will leverage these functions to secure the service endpoints and properly route requests to authenticate.


## API

### Module initialization function 

`(secret, userStoreFilePath, options) ⇒ Object`
* configure the authentication module with secret use for token encoding/decoding

| Param | Type | Description |
| --- | --- | --- |
| secret | <code>string</code> | secret for encoding/decoding tokens |
| userStoreFilePath | <code>string</code> | path to the JSON file containing the array of username/password objects |
| options | <code>object</code> | options object |
| options.tokenExpirationMinutes | <code>integer</code> | minutes until token expires (default 60) |


## Notes on use with ArcGIS Online and ArcGIS Portal  
This authorization plugin has been tested with ArcGIS Online and ArcGIS Enterprise. Note that these ArcGIS products appear to block or be impaired by SSH-tunneling tools like `ngrok`, so if you are trying to test a local Koop instance against Online or Enterprise, it may not work as otherwise expected.  Generally, you'll have to do a "real" deployment to actually test authorization against these products.

For enterprise versions of Portal earlier than 10.6, you may need to [import the root of your certificate into Portal's trust store](http://enterprise.arcgis.com/en/portal/10.5/administer/linux/import-a-certificate-into-the-portal.htm). We have observed the inability to store credentials for a secured Koop service on Portal instances that have not yet imported the root SSL certificate (of the Koop instance) into the trust-store.

[npm-image]: https://img.shields.io/npm/v/@koopjs/auth-direct-file.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/@koopjs/auth-direct-file
[travis-image]: https://travis-ci.org/koopjs/koop-auth-direct-file.svg?style=flat-square


## General notes on the authentication pattern used here

The authentication module implemented here uses a *direct authentication* pattern; it receives user credentials (username/password) from a client and authenticates those credentials against an identity/user-store. Requests with valid credentials are issued an access-token (a string of encoded-data); The access token is encoded with the use of a secret known only to the Koop server. The access-token expires and becomes invalid after a certain period (default of 60 minutes).

![get access token](https://gist.githubusercontent.com/rgwozdz/e44f3686abe40360532fbcc6dccf225d/raw/9768df32fc62e99ce7383c124cab8efdf45b1e18/koop-direct-auth-access-token.png)

In addition to directly accepting username and password, the `authenticate` method will also accept a valid token.  If receivied, a new token (with new expiry time) is issued and returned.

The issued access-token should be attached to all subsequent service requests by the client. When the server receives a request, it will check for the presence of an access-token and reject any requests that are missing such token. If the token is present, the server attempts to decode it with its stored secret. Failure to decode results in a request rejection. Once decoded, the server checks the token's expiration-date and rejects any token with a date that is out of range. If the token is not expired, the request for the desired resource proceeds.

![enter image description here](https://gist.githubusercontent.com/rgwozdz/e44f3686abe40360532fbcc6dccf225d/raw/9768df32fc62e99ce7383c124cab8efdf45b1e18/koop-direct-auth-resources.png)

