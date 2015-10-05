module.exports = function ( grunt ) {
	grunt.loadNpmTasks( 'grunt-contrib-jshint' );
	grunt.loadNpmTasks( 'grunt-jscs' );
	grunt.loadNpmTasks( 'grunt-banana-checker' );

	grunt.initConfig( {
		jshint: {
			all: [ '*.js' ]
		},
		jscs: {
			all: [ '*.js' ]
		},
		banana: {
			options: {
				disallowDuplicateTranslations: false,
				requireMetadata: false
			},
			all: 'i18n/'
		}
	} );

	grunt.registerTask( 'test', [ 'jshint', 'jscs', 'banana' ] );
};
