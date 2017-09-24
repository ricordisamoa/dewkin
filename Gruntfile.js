/* eslint-env node */
module.exports = function ( grunt ) {
	'use strict';

	grunt.loadNpmTasks( 'grunt-eslint' );
	grunt.loadNpmTasks( 'grunt-banana-checker' );

	grunt.initConfig( {
		eslint: {
			all: [ '*.js' ]
		},
		banana: {
			options: {
				disallowUnusedTranslations: true
			},
			all: 'i18n/'
		}
	} );

	grunt.registerTask( 'test', [ 'eslint', 'banana' ] );
};
