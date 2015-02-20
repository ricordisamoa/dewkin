module.exports = function ( grunt ) {
	grunt.loadNpmTasks( 'grunt-contrib-jshint' );
	grunt.loadNpmTasks( 'grunt-jscs' );

	grunt.initConfig( {
		jshint: {
			all: [ '*.js' ]
		},
		jscs: {
			all: [ '*.js' ]
		}
	} );

	grunt.registerTask( 'test', [ 'jshint', 'jscs' ] );
};
