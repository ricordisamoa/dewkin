/* jshint node:true */
module.exports = function ( grunt ) {
	grunt.loadNpmTasks( 'grunt-contrib-jshint' );
	grunt.loadNpmTasks( 'grunt-jscs' );
	grunt.loadNpmTasks( 'grunt-banana-checker' );

	grunt.initConfig( {
		jshint: {
			options: {
				jshintrc: true
			},
			all: [ '*.js' ]
		},
		jscs: {
			all: [ '*.js' ]
		},
		banana: {
			options: {
				disallowUnusedTranslations: true
			},
			all: 'i18n/'
		}
	} );

	grunt.registerTask( 'test', [ 'jshint', 'jscs', 'banana' ] );
};
