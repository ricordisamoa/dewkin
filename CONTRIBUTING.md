# Contributing to the Deep Wiki Inspector

## JavaScript

* Stick with ECMAScript 5's [strict mode][strict mode].
* Follow the [MediaWiki coding conventions][CC].
* Always [document][CC-doc] new classes and methods.
* Load third-party libraries from the [cdnjs mirror][cdnjs] at Wikimedia
  Tool Labs.
* Use jQuery `Deferred`s and `Promise`s instead of callbacks.
* Work with dates in UTC flavors, e.g. use `Date#getUTCDate()` instead of
  `Date#getDate()` and `d3.time.format.utc()` instead of `d3.time.format()`.
  Mixtures of local and UTC times are likely to cause subtle bugs.

## Internationalization

There is no aided translation system yet. You have to copy one of the existing
JSON files from the `i18n` folder — preferably English or Italian, since those
are the most up to date. Sorry for the inconvenience.

[strict mode]: //developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
[CC]: //www.mediawiki.org/wiki/Manual:Coding_conventions/JavaScript
[CC-doc]: //www.mediawiki.org/wiki/Manual:Coding_conventions/JavaScript#Documentation
[cdnjs]: //tools.wmflabs.org/cdnjs/
