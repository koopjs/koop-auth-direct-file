# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## 2.0.0
### Changed
* `authorize` function argument is now the full Express request object
* Authorization token may be delivered by query parameter `token` or the `authorization` header
* `authenticate` function argument is now the full Express request object
* `authenticate` function rejects if username or password are missing
* Update koop-output-geoservices peer dependency to 2.0.0

## [1.2.0] - 2018-06-08
### Added
* replaced `getAuthenticationSpecification` with `authenticationSpecification`

## [1.1.1] - 2018-05-31
### Fixed
* Include peer-dependencies koop and and koop-output-geoservices

## [1.1.0] - 2018-05-29
### Added
* new option `useHttp`. Must be a boolean. This will get added verbatim to the result of authenticationSpecification function

## [1.0.0] - 2018-05-22
### Added
* Initial release of an authentication plugin for Koop that leverages a file-based user-store.

[2.0.0]: https://github.com/koopjs/koop-auth-direct-file/compare/v1.2.0...v2.0.0
[1.2.0]: https://github.com/koopjs/koop-auth-direct-file/compare/v1.1.0...v1.2.0
[1.1.1]: https://github.com/koopjs/koop-auth-direct-file/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/koopjs/koop-auth-direct-file/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/koopjs/koop-auth-direct-file/releases/tag/v1.0.0
