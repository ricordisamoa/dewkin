/**
 * DEep WiKi INspector (DEWKIN)
 * Copyright (C) 2013-2018 Ricordisamoa
 *
 * https://meta.wikimedia.org/wiki/User:Ricordisamoa
 * https://tools.wmflabs.org/ricordisamoa/
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
( function () {
'use strict';

var ContribsList, util, allNamespaces; // FIXME: kill allNamespaces

window.charts = {};

/**
 * @class
 * @extends Array
 * @constructor
 */
ContribsList = function () {
	var list,
		method,
		args = Array.prototype.slice.call( arguments );

	if ( args.length === 1 && Array.isArray( args[ 0 ] ) ) {
		list = args[ 0 ];
	} else {
		list = Object.create( Array.prototype );
		list = ( Array.apply( list, arguments ) || list );
	}

	for ( method in ContribsList.prototype ) {
		// eslint-disable-next-line no-prototype-builtins
		if ( ContribsList.prototype.hasOwnProperty( method ) ) {
			list[ method ] = ContribsList.prototype[ method ];
		}
	}
	return list;
};

ContribsList.prototype = {

	/**
	 * Sort the ContribsList by timestamp, in place, in ascending order.
	 */
	sort: function () {
		return new ContribsList( Array.prototype.sort.call( this, function ( a, b ) {
			var ts1 = new Date( a.timestamp ),
				ts2 = new Date( b.timestamp );
			return ( ( ts1 < ts2 ) ? -1 : ( ( ts1 > ts2 ) ? 1 : 0 ) );
		} ) );
	},

	log: function () {
		// eslint-disable-next-line no-console
		console.log( this );
	},

	filterByNamespace: function ( alsoEmpty ) {
		var contr = {},
			self = this;
		$.each( $.map( allNamespaces, function ( e ) {
			return e;
		} ), function ( nsIndex, ns ) {
			var f = self.grepByNamespace( ns.id );
			if ( f.length > 0 || alsoEmpty === true ) {
				contr[ ns.id ] = f;
			}
		} );
		return contr;
	},

	filterByDay: function () {
		var j,
			contr = {};
		for ( j = 0; j < 7; j++ ) {
			contr[ j ] = this.grepByDay( j );
		}
		return contr;
	},

	filterByHour: function () {
		var j,
			contr = [];
		for ( j = 0; j < 24; j++ ) {
			contr.push( this.grepByHour( j ) );
		}
		return contr;
	},

	filterByTag: function () {
		var contr = {};
		this.forEach( function ( e ) {
			( e.tags || [] ).forEach( function ( tag ) {
				if ( contr[ tag ] ) {
					contr[ tag ].push( e );
				} else {
					contr[ tag ] = [ e ];
				}
			} );
		} );
		return contr;
	},

	filterByMonth: function () {
		var firstMonth,
			contr = {},
			s = {};
		$.each( this, function ( i, e ) {
			var date = new Date( e.timestamp ),
				code = util.yearMonth( date );
			if ( firstMonth === undefined || code < firstMonth ) {
				firstMonth = code;
			}
			if ( contr[ code ] ) {
				contr[ code ].push( e );
			} else {
				contr[ code ] = [ e ];
			}
		} );
		$.each( util.allMonths( firstMonth ), function ( i, e ) {
			if ( contr[ e ] ) {
				s[ e ] = new ContribsList( contr[ e ] );
			} else {
				s[ e ] = new ContribsList();
			}
		} );
		return s;
	},

	filterByMonthAndNamespace: function () {
		var contr = {};
		$.each( this.filterByMonth(), function ( k, v ) {
			contr[ k ] = v.filterByNamespace( true );
		} );
		return contr;
	},

	filterByNamespaceAndMonth: function () {
		var contr = {};
		$.each( this.filterByNamespace( true ), function ( k, v ) {
			contr[ k ] = new ContribsList( v ).filterByMonth();
		} );
		return contr;
	},

	filterByProgrammingLanguage: function () {
		var contr = {};
		$.each( this, function ( i, c ) {
			var lang, m;
			if ( c.ns === 828 ) { // Scribunto modules
				lang = 'lua';
			} else if ( [ 2, 8 ].indexOf( c.ns ) !== -1 ) {
				m = c.title.toLowerCase().match( /\.(js|css)$/ );
				if ( m !== null ) {
					lang = m[ 1 ];
				} else if ( c.ns === 2 && /\.py$/.test( c.title ) ) {
					lang = 'py';
				}
			}
			if ( lang ) {
				if ( !contr[ lang ] ) {
					contr[ lang ] = new ContribsList();
				}
				contr[ lang ].push( c );
			}
		} );
		return contr;
	},

	grepByEditSummary: function ( summary ) {
		return new ContribsList( this.filter( function ( e ) {
			return ( summary === undefined ? e.comment !== '' : e.comment === summary );
		} ) );
	},

	grepByNamespace: function ( ns ) {
		return new ContribsList( this.filter( function ( e ) {
			return Array.isArray( ns ) ? ( ns.indexOf( e.ns ) !== -1 ) : ( e.ns === ns );
		} ) );
	},

	grepByDay: function ( number ) {
		return new ContribsList( this.filter( function ( e ) {
			return new Date( e.timestamp ).getUTCDay() === number;
		} ) );
	},

	grepByHour: function ( number ) {
		return new ContribsList( this.filter( function ( e ) {
			return new Date( e.timestamp ).getUTCHours() === number;
		} ) );
	},

	topEdited: function ( ns ) {
		var titles, occurr, sortedKeys, overflow, sortedOccurr,
			c = this;
		if ( ns !== undefined ) {
			c = c.grepByNamespace( ns );
		}
		titles = c.map( function ( e ) {
			return e.title;
		} );
		occurr = {};
		titles.forEach( function ( e ) {
			if ( occurr[ e ] ) {
				occurr[ e ] = occurr[ e ] + 1;
			} else {
				occurr[ e ] = 1;
			}
		} );
		sortedKeys = Object.keys( occurr ).sort( function ( a, b ) {
			return (
				( occurr[ a ] > occurr[ b ] ) ? -1 : ( ( occurr[ a ] < occurr[ b ] ) ? 1 : 0 )
			);
		} );
		overflow = false;
		if ( sortedKeys.length > 30 ) {
			overflow = true;
			sortedKeys = sortedKeys.slice( 0, 30 );
		}
		sortedOccurr = {};
		sortedKeys.forEach( function ( e ) {
			sortedOccurr[ e ] = occurr[ e ];
		} );
		return [ sortedOccurr, overflow ];
	},

	/**
	 * Get data suitable for a punchcard chart.
	 *
	 * @return {number[][]} Arrays in the form [day 0-6, hour 0-23, number of edits]
	 */
	toPunchcard: function () {
		var d,
			contr = this,
			data = [];
		for ( d = 0; d < 7; d++ ) {
			// eslint-disable-next-line no-loop-func
			$.each( contr.grepByDay( d ).filterByHour(), function ( h, c ) {
				data.push( [ d, h, c.length ] );
			} );
		}
		return data;
	},

	/**
	 * Compute the longest sequence of consecutive days with contributions.
	 *
	 * @return {Date[]} The start and end date of one of the longest streaks,
	 *  or empty if none can be found
	 */
	longestStreak: function () {
		var prev = [],
			cur = [],
			cc = new ContribsList( this.slice( 0 ) ),
			sameOrNext = function ( d1, d2 ) {
				return d1 === d2 || ( d2 - d1 === 86400000 );
			};
		cc.sort();
		cc.forEach( function ( ct, i ) {
			var d = new Date( ct.timestamp ).setHours( 0, 0, 0, 0 );
			if ( cur.length === 0 ) {
				cur[ 0 ] = d;// start streak
			} else if ( cur.length === 1 ) {
				if ( sameOrNext( cur[ 0 ], d ) ) {
					cur[ 1 ] = d;// continue streak
				} else {
					cur = [];
				}
			} else if ( cur.length === 2 ) {
				if ( i < cc.length && sameOrNext( cur[ 1 ], d ) ) {
					cur[ 1 ] = d;// continue streak
				} else { // streak broken
					if ( prev.length === 0 || cur[ 1 ] - cur[ 0 ] > prev[ 1 ] - prev[ 0 ] ) {
						prev = cur;// (over)write longest streak
					}
					cur = [];// reset current streak anyway
				}
			}
		} );
		return prev;
	}

};

/**
 * Interface to MediaWiki's action API.
 *
 * @class
 *
 * @constructor
 * @param {string} url
 */
function MediaWikiApi( url ) {
	this.url = url;
	this.defaults = {
		format: 'json'
	};
}

/**
 * Send a GET request to the MediaWiki API.
 *
 * @param {Object} data Parameters for the request
 * @return {JQuery.Promise}
 */
MediaWikiApi.prototype.get = function ( data ) {
	return $.ajax( {
		dataType: 'jsonp',
		type: 'GET',
		url: this.url,
		data: $.extend( {}, data, this.defaults )
	} );
};

/**
 * Helper class for getting data from the MediaWiki API.
 *
 * @class
 *
 * @constructor
 * @param {Object} config Configuration options
 * @cfg {MediaWikiApi} localApi Interface to the API of the site the inspector should run on
 * @cfg {MediaWikiApi} globalApi Interface to the API of the site exposing the site matrix
 */
function DataGetter( config ) {
	this.localApi = config.localApi;
	this.globalApi = config.globalApi;
}

DataGetter.prototype = {

	allUsers: function ( prefix ) {
		return this.localApi.get( {
			action: 'query',
			list: 'allusers',
			auwitheditsonly: 1,
			auprefix: prefix,
			aulimit: 8,
			prop: ''
		} )
		.then( function ( data ) {
			return data.query.allusers;
		} );
	},

	globalAllUsers: function ( prefix ) {
		return this.globalApi.get( {
			action: 'query',
			list: 'globalallusers',
			aguprefix: prefix,
			agulimit: 8,
			aguprop: ''
		} )
		.then( function ( data ) {
			return data.query.globalallusers;
		} );
	},

	siteMatrix: function () {
		return this.globalApi.get( {
			action: 'sitematrix',
			smsiteprop: 'dbname|url',
			smlangprop: 'site'
		} )
		.then( function ( data ) {
			var dbNames = {};
			$.each( data.sitematrix, function () {
				$.each( this.site || ( Array.isArray( this ) ? this : [] ), function () {
					if (
						this.dbname &&
						this.url &&
						this.private === undefined &&
						this.fishbowl === undefined
					) {
						dbNames[ this.dbname ] = this.url.replace( /^http:\/\//, '//' );
					}
				} );
			} );
			return dbNames;
		} );
	},

	namespaces: function () {
		return this.localApi.get( {
			action: 'query',
			meta: 'siteinfo',
			siprop: 'namespaces'
		} )
		.then( function ( b ) {
			var ns = b.query.namespaces;
			delete ns[ '-1' ];
			return ns;
		} );
	},

	uploads: function () {
		var self = this,
		uploads = [],
		getUploadsRecursive = function ( continuation ) {
			var params = {
				action: 'query',
				list: 'allimages',
				aiprop: '',
				aisort: 'timestamp',
				aiuser: self.user,
				ailimit: 'max'
			};
			if ( continuation !== undefined ) {
				$.extend( params, continuation );
			} else {
				params.continue = '';
			}
			return self.localApi.get( params ).then( function ( data ) {
				uploads = uploads.concat( data.query.allimages.map( function ( e ) {
					return e.name.replace( /_/g, ' ' );
				} ) );
				if ( data.continue ) {
					return getUploadsRecursive( data.continue );
				} else {
					return uploads;
				}
			} );
		};
		return getUploadsRecursive();
	},

	contribs: function () {
		var self = this,
		contribs = [],
		getContribsRecursive = function ( continuation ) {
			var params = {
				action: 'query',
				list: 'usercontribs',
				ucuser: self.user,
				ucprop: 'title|timestamp|comment|tags|ids|sizediff',
				uclimit: 'max'
			};
			if ( continuation !== undefined ) {
				$.extend( params, continuation );
			} else {
				params.list += '|users';
				params.ususers = self.user;
				params.usprop = 'registration|editcount';
				params.continue = '';
			}
			return self.localApi.get( params ).then( function ( data ) {
				var userObj;
				contribs = contribs.concat( data.query.usercontribs );
				if ( data.query.users ) {
					userObj = data.query.users[ Object.keys( data.query.users )[ 0 ] ];
					self.registration = userObj.registration;
					self.editCount = userObj.editcount;
				}
				if ( data.continue ) {
					return getContribsRecursive( data.continue );
				} else {
					return contribs;
				}
			} );
		};
		return getContribsRecursive();
	},

	messages: function ( lang, msgs ) {
		var getMessagesRecursive,
			self = this,
			messages = {};

		msgs = msgs.slice(); // clone

		getMessagesRecursive = function () {
			return self.localApi.get( {
				action: 'query',
				meta: 'allmessages',
				amlang: lang,
				ammessages: msgs.splice( 0, 50 ).join( '|' )
			} )
			.then( function ( data ) {
				( data.query.allmessages || [] ).forEach( function ( v ) {
					messages[ v.name ] = v[ '*' ];
				} );
				if ( msgs.length > 0 ) {
					return getMessagesRecursive();
				}
				return messages;
			} );
		};

		return getMessagesRecursive();
	},

	/**
	 * @return {JQuery.Promise<RightsLogEvent[]>}
	 */
	rightsLog: function () {
		return this.localApi.get( {
			action: 'query',
			list: 'logevents',
			letype: 'rights',
			letitle: 'User:' + this.user,
			ledir: 'newer',
			lelimit: 'max'
		} )
		.then( function ( data ) {
			return data.query.logevents.filter( function ( el ) {
				// hack for old log entries
				return (
					el.params !== undefined &&
					el.params.oldgroups !== undefined &&
					el.params.newgroups !== undefined
				);
			} );
		} );
	},

	blockInfo: function () {
		return this.localApi.get( {
			action: 'query',
			list: 'users',
			ususers: this.user,
			usprop: 'blockinfo'
		} )
		.then( function ( data ) {
			return ( data.query.users[ 0 ] || {} );
		} );
	},

	votes: function () {
		return $.getJSON( '//tools.wmflabs.org/octodata/sucker.php', {
			action: 'votelookup',
			username: this.user,
			groupby: 'ballot'
		} );
	},

	geoData: function ( contribs ) {
		var geodata, titles, getGeodataRecursive,
			occurr = {},
			self = this;
		$.each( contribs, function ( key, val ) {
			if ( occurr[ val.title ] ) {
				if ( occurr[ val.title ].revid ) {
					occurr[ val.title ] = {
						count: 2,
						sizediff: occurr[ val.title ].sizediff + val.sizediff
					};
				} else {
					occurr[ val.title ].count += 1;
					occurr[ val.title ].sizediff += val.sizediff;
				}
			} else {
				occurr[ val.title ] = val;
			}
		} );
		geodata = {};
		titles = Object.keys( occurr );
		if ( titles.length === 0 ) {
			// Don't waste an AJAX request
			return $.Deferred().resolve( [] ).promise();
		}
		getGeodataRecursive = function () {
			return self.localApi.get( {
				action: 'query',
				prop: 'coordinates',
				titles: titles.splice( 0, 50 ).join( '|' )
			} )
			.then( function ( data ) {
				$.extend( geodata, data.query.pages );
				if ( titles.length > 0 ) {
					return getGeodataRecursive();
				} else {
					return geodata;
				}
			} );
		};
		return getGeodataRecursive().then( function ( coords ) {
			var coordinates, edits, numedits, marker,
				markers = [];
			$.each( coords, function ( pageid, page ) {
				if ( page.coordinates ) {
					coordinates = page.coordinates;
					if ( coordinates.length === 1 ) {
						coordinates = coordinates[ 0 ];
						edits = occurr[ page.title ];
						numedits = ( edits.count || 1 );
						marker = {
							coords: coordinates,
							title: page.title,
							sizediff: edits.sizediff,
							numedits: numedits
						};
						if ( edits.revid ) {
							$.extend( marker, { revid: edits.revid } );
						}
						markers.push( marker );
					}
				}
			} );
			markers.sort( function ( a, b ) {
				return b.numedits - a.numedits;
			} );
			return markers;
		} );
	}

};

util = {

	/**
	 * Get the month code from a date.
	 *
	 * @param {Date} date
	 * @return {string} The month code in the form yyyy/mm
	 */
	yearMonth: function ( date ) {
		var month = ( date.getUTCMonth() + 1 ).toString();
		if ( month.length === 1 ) {
			month = '0' + month;
		}
		return date.getUTCFullYear() + '/' + month;
	},

	/**
	 * Set of HEX colors by MediaWiki namespace number from Soxred93's Edit Counter
	 * Copyright (C) 2010 Soxred93
	 * Released under the terms of the GNU General Public License
	 * source code: <https://tools.wmflabs.org/xtools/pcount/source.php?path=index>
	 */
	namespaceColors: {
		0: 'FF5555',
		1: '55FF55',
		2: 'FFFF55',
		3: 'FF55FF',
		4: '5555FF',
		5: '55FFFF',
		6: 'C00000',
		7: '0000C0',
		8: '008800',
		9: '00C0C0',
		10: 'FFAFAF',
		11: '808080',
		12: '00C000',
		13: '404040',
		14: 'C0C000',
		15: 'C000C0',
		100: '75A3D1',
		101: 'A679D2',
		102: '660000',
		103: '000066',
		104: 'FAFFAF',
		105: '408345',
		106: '5c8d20',
		107: 'e1711d',
		108: '94ef2b',
		109: '756a4a',
		110: '6f1dab',
		111: '301e30',
		112: '5c9d96',
		113: 'a8cd8c',
		114: 'f2b3f1',
		115: '9b5828',
		120: 'FF99FF',
		121: 'CCFFFF',
		122: 'CCFF00',
		123: 'CCFFCC',
		200: '33FF00',
		201: '669900',
		202: '666666',
		203: '999999',
		204: 'FFFFCC',
		205: 'FF00CC',
		206: 'FFFF00',
		207: 'FFCC00',
		208: 'FF0000',
		209: 'FF6600',
		446: '06DCFB',
		447: '892EE4',
		460: '99FF66',
		461: '99CC66',
		470: 'CCCC33',
		471: 'CCFF33',
		480: '6699FF',
		481: '66FFFF',
		710: 'FFCECE',
		711: 'FFC8F2',
		828: 'F7DE00',
		829: 'BABA21',
		866: 'FFFFFF',
		867: 'FFCCFF',
		1198: 'FF34B3',
		1199: '8B1C62'
	},
	/* end of Soxred93's code */

	/**
	 * Get the color code of a namespace, falling back to #CCC.
	 *
	 * @param {number} ns The namespace id
	 * @return {string} The color code
	 */
	colorFromNamespace: function ( ns ) {
		return '#' + ( this.namespaceColors[ ns ] || 'CCC' );
	},

	/**
	 * Map of programming language codes to names and colors,
	 * inspired by https://github.com/github/linguist/blob/master/lib/linguist/languages.yml
	 */
	programmingLanguages: {
		css: [ 'CSS', '563d7c' ],
		js:  [ 'JavaScript', 'f1e05a' ],
		lua: [ 'Lua', '000080' ],
		py:  [ 'Python', '3572A5' ]
	},

	/**
	 * Array of colors for map markers,
	 * subset of https://commons.wikimedia.org/wiki/Special:PrefixIndex/File:Location_dot
	 */
	markerColors: [ 'bisque', 'black', 'blue', 'coral', 'cyan', 'darkslategray', 'deeppink', 'green',
		'lightgrey', 'lime', 'magenta', 'orange', 'purple', 'red', 'teal', 'yellow' ],

	/**
	 * Set of arbitrary HTML colors by MediaWiki user group
	 */
	groupsColors: {
		autopatrolled:    'dodgerblue',
		rollbacker:       'darkolivegreen',
		filemover:        'orange',
		translationadmin: 'orangered',
		sysop:            'darkred',
		bureaucrat:       'darkviolet',
		checkuser:        'darkslategray',
		oversight:        'navy',
		steward:          'black'
	},

	/**
	 * Get an array of month codes between two months (included).
	 *
	 * @param {string} from Month code in the form yyyy/mm
	 * @return {string[]} Array of month codes in the form yyyy/mm
	 */
	allMonths: function ( from ) {
		var fromSplit, fromYear, fromMonth, months, toYear, toMonth,
			year, actualToYear, month, m;
		fromSplit = from.split( '/' );
		fromYear = parseInt( fromSplit[ 0 ] );
		fromMonth = parseInt( fromSplit[ 1 ] ) - 1;
		months = [];
		toYear = new Date().getUTCFullYear();
		toMonth = new Date().getUTCMonth();
		for ( year = fromYear; year <= toYear; year++ ) {
			actualToYear = ( year === toYear ? toMonth : 11 );
			for ( month = ( year === fromYear ? fromMonth : 0 ); month <= actualToYear; month++ ) {
				m = ( month + 1 ).toString();
				months.push( year + '/' + ( m.length === 1 ? '0' : '' ) + m );
			}
		}
		return months;
	}

};

/**
 * Class to handle localization.
 *
 * @class
 *
 * @constructor
 * @param {string} language Language code of the UI
 * @param {DataGetter} dataGetter To use the allmessages API
 */
function Localizer( language, dataGetter ) {
	this.language = language;
	this.fallback = 'en';
	this.dataGetter = dataGetter;
	this.messages = {};
}

/**
 * Get localized messages from the wiki and from the current instance of DEWKIN.
 *
 * @param {string[]} messages MediaWiki message keys
 * @return {JQuery.Promise}
 */
Localizer.prototype.loadMessages = function ( messages ) {
	var self = this;
	return self.dataGetter.messages( self.language, messages )
		.then( function ( data ) {
			$.extend( self.messages, data );
			self.harvestMonthsAndWeekdays();
			return self.loadCustomMessages( self.language );
		} );
};

/**
 * Set some properties on the current instance as arrays of localized messages.
 *
 * @private
 */
Localizer.prototype.harvestMonthsAndWeekdays = function () {
	var self = this;
	self.months = Localizer.months.map( function ( el ) {
		return self.messages[ el ];
	} );
	self.weekdays = Localizer.weekdays.map( function ( el ) {
		return self.messages[ el ];
	} );
	self.weekdaysShort = Localizer.weekdaysShort.map( function ( el ) {
		return self.messages[ el ];
	} );
};

/**
 * Get localized messages from the current instance of DEWKIN.
 *
 * @private
 * @param {string} lang MediaWiki language code
 * @return {JQuery.Deferred}
 */
Localizer.prototype.loadCustomMessages = function ( lang ) {
	var self = this,
		deferred = $.Deferred();
	$.get( 'i18n/' + lang + '.json' )
	.done( function ( data ) {
		self.messages = $.extend( {}, data, self.messages );
		if ( lang === self.fallback ) {
			deferred.resolve( true );
		} else {
			self.loadCustomMessages( self.fallback ).done( deferred.resolve );
		}
	} )
	.fail( function () {
		if ( lang === self.fallback ) {
			deferred.resolve( false );
		} else {
			self.loadCustomMessages( self.fallback ).done( deferred.resolve );
		}
	} );
	return deferred;
};

/**
 * Apply parameter substitution and evaluate PLURAL syntax within a message.
 *
 * @private
 * @param {string} msg The raw message
 * @param {...Mixed} arguments The parameters
 * @return {string} The final message
 */
Localizer.prototype.parseMsg = function ( msg ) {
	var regex = /(^|[^/])\$(\d+)(?=\D|$)/g,
	regex2 = new RegExp( regex.source, '' ),
	args = Array.prototype.slice.call( arguments );
	msg = msg.replace( regex, function ( el ) {
		var m = el.match( regex2 );
		if ( m && args[ parseInt( m[ 2 ] ) ] !== undefined ) {
			return m[ 1 ] + args[ parseInt( m[ 2 ] ) ];
		} else {
			return el;
		}
	} );
	regex = /\{\{PLURAL:(-?\d+(\.\d+)?)\|([^|]*)(\|([^|]*))?\}\}/g;
	regex2 = new RegExp( regex.source, '' );
	msg = msg.replace( regex, function ( el ) {
		var m = el.match( regex2 );
		if ( m ) {
			return parseFloat( m[ 1 ] ) === 1 ? m[ 3 ] : ( m[ 5 ] || m[ 3 ] );
		} else {
			return el;
		}
	} );
	return msg;
};

/**
 * Get an array joined with natural separators.
 *
 * @param {Array} array
 * @return {string}
 */
Localizer.prototype.listToText = function ( array ) {
	var comma = this.i18n( 'comma-separator' ),
		sep = this.i18n( 'word-separator' ),
		and = this.i18n( 'and' );
	switch ( array.length ) {
		case 0: return '';
		case 1: return array[ 0 ];
		case 2: return array.join( sep + and + sep );
		default: return array.slice( 0, -1 ).join( comma ) + comma +
			and + sep + array[ array.length - 1 ];
	}
};

/**
 * Get a localized percentage.
 *
 * @param {number} num Numerator
 * @param {number} outof Denominator
 * @param {number} [precision=2] Number of decimal digits to show
 * @param {Mixed} [format] If provided, used instead of num for display
 * @return {string}
 */
Localizer.prototype.percent = function ( num, outof, precision, format ) {
	if ( precision === undefined ) {
		precision = 2;
	}
	return ( format || num.toLocaleString() ) + this.i18n( 'word-separator' ) +
		this.i18n( 'parentheses',
			this.i18n( 'percent', parseFloat(
				( num / outof * 100 ).toFixed( precision ) )
			)
		);
};

/**
 * Get the name of a user group on the current project.
 *
 * @param {string} group
 * @return {string} Can be localized and/or HTML
 */
Localizer.prototype.groupColor = function ( group ) {
	var local = ( this.messages[ 'group-' + group + '-member' ] || group );
	return util.groupsColors[ group ] ?
		( '<span style="background-color:' + util.groupsColors[ group ] +
			';color:white">' + local + '</span>' ) :
		local;
};

/**
 * Get a human-readable difference between two dates.
 *
 * @param {Date} olddate
 * @param {Date} [newdate]
 * @param {number|null} [precision]
 * @param {boolean} [ago]
 * @return {string}
 */
Localizer.prototype.dateDiff = function ( olddate, newdate, precision, ago ) {
	var labels = [
		'years',
		'months',
		'weeks',
		'days',
		'hours',
		'minutes',
		'seconds'
	],
	mult = [ 12, 4.34, 7, 24, 60, 60, 1000 ],
	diff = ( newdate || new Date() ).getTime() - olddate.getTime(),
	self = this,
	message = [];
	mult.forEach( function ( num, i ) {
		var f, fl;
		if (
			precision === undefined ||
			precision === null ||
			i <= precision ||
			message.length === 0
		) {
			f = Math.floor( mult.slice( i ).reduce( function ( a, b ) {
				return a * b;
			} ) );
			fl = Math.floor( diff / f );
			if ( fl > 0 ) {
				message.push( self.i18n( labels[ i ], fl ) );
				diff -= fl * f;
			}
		}
	} );
	if ( message.length > 0 ) {
		if ( ago ) {
			return self.i18n( 'ago', self.listToText( message ) );
		}
		return self.listToText( message );
	}
	return self.i18n( 'just-now' );
};

/* canonical day and month names to load MediaWiki translated messages */
Localizer.weekdays = [
	'Sunday',
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday'
];
Localizer.weekdaysShort = [
	'Sun',
	'Mon',
	'Tue',
	'Wed',
	'Thu',
	'Fri',
	'Sat'
];
Localizer.months = [
	'Jan',
	'Feb',
	'Mar',
	'Apr',
	'May',
	'Jun',
	'Jul',
	'Aug',
	'Sep',
	'Oct',
	'Nov',
	'Dec'
];

/**
 * Get the keys of messages that should always be loaded.
 *
 * @return {string[]} MediaWiki message keys
 */
Localizer.prototype.getEssentialMessages = function () {
	// time-related messages
	return [ 'ago', 'just-now', 'seconds', 'duration-seconds',
		'minutes', 'hours', 'days', 'weeks', 'months', 'years' ]
		// miscellaneous
		.concat( [ 'and', 'comma-separator', 'colon-separator', 'word-separator', 'parentheses',
			'percent', 'diff', 'nchanges', 'size-bytes', 'tags-hitcount' ] )
		.concat( Localizer.weekdays )
		.concat( Localizer.weekdaysShort )
		.concat( Localizer.months );
};

/**
 * Apply parameter substitution and evaluate PLURAL syntax within a message.
 *
 * @param {string} msg The message key
 * @param {...Mixed} arguments The parameters
 * @return {string} The final message
 */
Localizer.prototype.i18n = function ( msg ) {
	var params = Array.prototype.slice.call( arguments );
	params[ 0 ] = this.messages[ msg ];
	return this.parseMsg.apply( this, params );
};

/**
 * Main class for the inspector.
 *
 * @class
 *
 * @constructor
 * @param {Object} config Configuration options
 * @cfg {string} globalApiUrl Address of the api.php endpoint exposing the sitematrix
 * @cfg {string} userLanguage Language code to get interface messages for
 * @cfg {jQuery} $form Form element to start the inspector
 * @cfg {jQuery} $user Input field for the inspected user's name
 * @cfg {jQuery} $project Input field for the wiki ID
 * @cfg {jQuery} $init Submit button triggering the inspector
 * @cfg {jQuery} $general Container for general information
 * @cfg {jQuery} $topEdited Container for the '(top) edited in namespace' list
 * @cfg {jQuery} $editSummary Element of the 'edit summary' tab
 * @cfg {jQuery} $tagsTable Table element for edit tags
 * @cfg {jQuery} $votes Element of the 'votes' tab
 */
function Inspector( config ) {
	this.dataGetter = new DataGetter( {
		globalApi: new MediaWikiApi( config.globalApiUrl )
	} );
	this.localizer = new Localizer( config.userLanguage, this.dataGetter );
	this.$form = config.$form;
	this.$user = config.$user;
	this.$project = config.$project;
	this.$init = config.$init;
	this.$general = config.$general;
	this.$topEdited = config.$topEdited;
	this.$editSummary = config.$editSummary;
	this.$tagsTable = config.$tagsTable;
	this.$votes = config.$votes;
}

/**
 * Shorthand for this.localizer.i18n().
 *
 * @private
 */
Inspector.prototype.i18n = function () {
	return this.localizer.i18n.apply( this.localizer, arguments );
};

/**
 * Get a 'span' or 'strong' HTML element for a given sizediff.
 *
 * @param {number} sizediff
 * @return {string} HTML
 */
Inspector.prototype.sizediffIndicator = function ( sizediff ) {
	var className,
		sizedifftag = Math.abs( sizediff ) > 500 ? 'strong' : 'span';
	if ( sizediff === 0 ) {
		className = 'mw-plusminus-null';
	} else if ( sizediff > 0 ) {
		className = 'mw-plusminus-pos';
	} else {
		className = 'mw-plusminus-neg';
	}
	return '<' + sizedifftag + ' class="' + className + '">' +
		( sizediff > 0 ? '+' : '' ) + this.i18n( 'size-bytes', sizediff ) +
		'</' + sizedifftag + '>';
};

/**
 * Try to get a user name and a project ID from the current location.
 *
 * @private
 */
Inspector.prototype.tryPermalink = function () {
	var path, inspData;
	path = window.location.pathname.split( '/' );
	if ( path.length === 3 ) {
		inspData = decodeURIComponent( path[ 2 ] ).split( '@' );
		if ( inspData.length === 2 ) {
			this.$user.val( inspData[ 0 ] );
			this.$project.val( inspData[ 1 ] );
			this.$form.submit();
		}
	}
};

/**
 * Enhance the user and project input fields with autocompletion.
 *
 * @private
 */
Inspector.prototype.registerTypeahead = function () {
	var self = this;

	// suggestions while typing "User name"
	self.$user.typeahead( {
		source: function ( query, process ) {
			var func,
				dbName = self.$project.val().trim();
			if ( dbName !== '' && self.sites[ dbName ] ) {
				self.dataGetter.localApi = new MediaWikiApi( self.sites[ dbName ] + '/w/api.php' );
				func = 'allUsers';
			} else {
				func = 'globalAllUsers';
			}
			self.dataGetter[ func ]( query ).done( function ( users ) {
				return process( users.map( function ( user ) {
					return user.name;
				} ) );
			} );
		}
	} );

	// suggestions while typing "Project"
	self.$project.typeahead( {
		source: function ( query, process ) {
			process( Object.keys( self.sites ) );
		}
	} );
};

/**
 * Handle the 'submit' event on the form.
 *
 * @private
 * @param {JQuery.Event} event Submit event
 */
Inspector.prototype.onSubmit = function ( event ) {
	var project;
	event.preventDefault();
	project = this.$project.val();
	this.wikipath = this.sites[ project ] + '/wiki/';
	this.dataGetter.localApi = new MediaWikiApi( this.sites[ project ] + '/w/api.php' );
	this.dataGetter.user = this.user = this.$user.val().replace( /_/g, ' ' );

	// 'Permalink'
	if ( window.history.pushState && window.location.pathname.split( /[^/]\/[^/]/ ).length === 1 ) {
		window.history.pushState(
			{},
			'',
			window.location.pathname.replace( /\/$/, '' ) + '/' +
				this.user.replace( / /g, '_' ) + '@' + project
		);
	}

	this.$init
	.attr( 'data-loading-text', 'Loading...' )
	.button( 'loading' )
	.siblings()
	.remove();

	this.realStart();
};

/**
 * Get the localized name of a namespace, falling back to 'ns-' and its number.
 *
 * @private
 * @param {number} number The namespace id
 * @return {string} The namespace name
 */
Inspector.prototype.namespaceName = function ( number ) {
	return this.namespaces[ number ] ?
		this.namespaces[ number ][ '*' ].replace( /^(Talk)?$/, 'Article $1' ).trim() :
		( 'ns-' + number );
};

/**
 * Generate the pie chart of edits by namespace.
 *
 * @private
 */
Inspector.prototype.generateNamespacesChart = function () {
	var inspector, contribsByNamespace, nsIdsSortedByNumberOfEdits,
		nsChartData, nsChart;

	inspector = this;
	contribsByNamespace = inspector.contribs.filterByNamespace( true );
	nsIdsSortedByNumberOfEdits = Object.keys( contribsByNamespace ).sort( function ( a, b ) {
		return contribsByNamespace[ b ].length - contribsByNamespace[ a ].length;
	} );
	nsChartData = nsIdsSortedByNumberOfEdits.filter( function ( ns ) {
		// only namespaces with contributions
		return contribsByNamespace[ ns ].length > 0;
	} )
	.map( function ( ns ) {
		var nsName = inspector.namespaceName( ns );
		return {
			id: ns,
			name: nsName,
			value: contribsByNamespace[ ns ].length,
			label: nsName + inspector.i18n( 'colon-separator' ) +
				inspector.localizer.percent(
					contribsByNamespace[ ns ].length,
					inspector.contribs.length
				),
			color: util.colorFromNamespace( ns )
		};
	} );
	nsChart = window.charts.pie( '#ns-chart', 20, 20, 600, 400, 150, nsChartData );
	nsChart.paths
	.on( 'click', function ( d ) {
		var te,
			self = d3.select( this );
		if ( self.classed( 'selected' ) ) {
			self
				.interrupt()
				.classed( 'selected', false )
				.attr( 'd', nsChart.arcOver );
			inspector.$topEdited.hide( 'fast' );
			nsChart.svg.attr( 'width', 600 );
		} else {
			nsChart.svg.attr( 'width', 340 );
			nsChart.g.selectAll( 'path' )
				.interrupt()
				.filter( function () { return this !== self; } )
				.classed( 'selected', false )
				.attr( 'd', nsChart.arc );
			self
				.classed( 'selected', true )
				.attr( 'd', nsChart.arcOver );
			te = inspector.contribs.topEdited( parseInt( d.data.id ) );
			inspector.$topEdited
			.empty()
			.append(
				$( '<h2>' )
				.text(
					inspector.i18n(
						te[ 1 ] ? 'top edited in ns' : 'edited in ns',
						Object.keys( te[ 0 ] ).length,
						d.data.name
					)
				)
			)
			.append(
				$( '<ul>' ).append(
					$.map( te[ 0 ], function ( v, k ) {
						return $( '<a>' )
							.text( k )
							.attr( 'href', inspector.wikipath + k )
							.appendTo( '<li>' + v + ' - </li>' )
							.parent();
					} )
				)
			).show( 'fast' );
		}
	} );
};

/**
 * @typedef {Object} Vote
 * @property {string} vt_diff
 * @property {string} vt_timestamp
 * @property {string} s_name
 */

/**
 * @typedef {Object} Poll
 * @property {string} b_project
 * @property {string} b_url
 * @property {string} b_title
 * @property {Vote[]} votes
 */

/**
 * Get a <li> element representing a vote.
 *
 * @private
 * @param {Poll} poll
 * @param {Vote} vote
 * @return {JQuery} The list item
 */
Inspector.prototype.getVoteItem = function ( poll, vote ) {
	return $( '<li>' )
		.html(
			this.i18n(
				'voted for',
				new Date( vote.vt_timestamp ).toUTCString(),
				vote.s_name,
				$( '<a>' )
				.attr( {
					href: poll.b_project + '?diff=' + vote.vt_diff,
					title: this.i18n( 'diff on project', vote.vt_diff, poll.b_project )
				} )
				.text( this.i18n( 'diff' ) )
				.get( 0 ).outerHTML
			)
		);
};

/**
 * Get an element or a string representing a list of votes.
 *
 * @private
 * @param {Poll} poll
 * @return {JQuery|string} A vote list or a placeholder
 */
Inspector.prototype.mapVotes = function ( poll ) {
	if ( poll.votes.length === 0 ) {
		return this.i18n( 'did not vote' );
	}

	return $( '<ul>' )
		.append( poll.votes.map( this.getVoteItem.bind( this, poll ) ) );
};

/**
 * Get an array of jQuery objects or strings representing a poll.
 *
 * @private
 * @param {Poll} poll
 * @return {Array} jQuery objects or strings to append
 */
Inspector.prototype.mapPoll = function ( poll ) {
	return [
		$( '<h3>' ).append(
			$( '<a>' )
			.attr( {
				href: poll.b_url,
				title: poll.b_title
			} )
			.text( poll.b_title )
		),
		this.mapVotes( poll )
	];
};

/**
 * Generate information for the votes tab.
 *
 * @private
 * @param {Object} result Object with votelookup
 */
Inspector.prototype.showVotes = function ( result ) {
	this.$votes
	.append( $.map( result.votelookup.ballots, this.mapPoll.bind( this ) ) );
};

/**
 * Generate the pie chart of edits by programming language.
 *
 * @private
 */
Inspector.prototype.generateProgrammingLanguagesChart = function () {
	var langs, sortedLangExts, codeChartData,
		self = this;

	langs = self.contribs.filterByProgrammingLanguage();
	sortedLangExts = Object.keys( langs ).sort( function ( a, b ) {
		return langs[ b ].length - langs[ a ].length;
	} );
	codeChartData = sortedLangExts.map( function ( ext ) {
		var langName = util.programmingLanguages[ ext ][ 0 ];
		return {
			id: ext,
			name: langName,
			value: langs[ ext ].length,
			label: langName + self.i18n( 'colon-separator' ) +
				self.localizer.percent( langs[ ext ].length, self.contribs.length ),
			color: '#' + util.programmingLanguages[ ext ][ 1 ]
		};
	} );
	window.charts.pie( '#code-chart', 20, 20, 520, 400, 150, codeChartData );
};

/**
 * For performance and technical reasons, the map is generated on demand.
 *
 * @private
 */
Inspector.prototype.registerMapTab = function () {
	var self = this;

	$( 'li>a[href="#map"]' )
	.one( 'shown.bs.tab', function () {
		$( '#map' ).append( 'Loading geodata...' );
		self.dataGetter.geoData( self.contribs.grepByNamespace( [ 0, 6 ] ) )
		.done( function ( geodata ) {
			var maxEdits, scale, map;
			if ( geodata.length > 0 ) {
				$( '#map' ).empty()
				.append( $( '<p>' ).text( self.i18n( 'map desc' ) ) )
				.append( $( '<div>' ).attr( 'id', 'map-container' ).css( 'height', '400px' ) );

				maxEdits = geodata[ 0 ].numedits;
				scale = d3.scale.sqrt()
					.domain( [ 0, maxEdits ] )
					.range( [ 0, 20 ] );
				map = L.map( 'map-container' ).setView( [ 0, 0 ], 2 );
				new L.TileLayer(
					'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
					{
						minZoom: 2,
						maxZoom: 18,
						attribution: 'Map data © <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
					}
				)
				.addTo( map );
				geodata.forEach( function ( marker ) {
					var edits,
						sizediff = self.sizediffIndicator( marker.sizediff ),
						markerRadius = scale( marker.numedits );
					if ( marker.revid ) {
						edits = '<a href="' + self.wikipath + '?diff=' + marker.revid + '">' +
							self.i18n( 'nchanges', '1' ) +
							'</a>';
					} else {
						edits = self.i18n( 'nchanges', marker.numedits );
					}
					L.marker( marker.coords, {
						icon: L.icon( {
							iconUrl: '//commons.wikimedia.org/wiki/Special:Filepath/Location_dot_' +
								util.markerColors[
									Math.floor( Math.random() * util.markerColors.length )
								] +
								'.svg',
							iconSize: [ markerRadius, markerRadius ]
						} )
					} )
					.addTo( map )
					.bindPopup(
						'<strong><a href="' + self.wikipath + marker.title + '">' +
						marker.title +
						'</a></strong><br>' +
						self.i18n( 'bytes with nchanges', sizediff, edits )
					);
				} );
			} else {
				$( '#map' ).empty().append( self.i18n( 'no geodata' ) );
			}
		} );
	} );
};

/**
 * Generate the months chart.
 *
 * @private
 */
Inspector.prototype.generateMonthsChart = function () {
	var contribsByMonthAndNamespace, nsIdsSortedByNumericValue,
		nsNames, nsColors, nsData,
		self = this;

	contribsByMonthAndNamespace = this.contribs.filterByMonthAndNamespace();
	nsIdsSortedByNumericValue = Object.keys( this.namespaces ).sort( function ( a, b ) {
		return Number( a ) - Number( b );
	} );
	nsNames = nsIdsSortedByNumericValue.map( self.namespaceName.bind( self ) );
	nsColors = nsIdsSortedByNumericValue.map( util.colorFromNamespace.bind( util ) );
	nsData = [];
	$.each( contribsByMonthAndNamespace, function ( month, byNs ) {
		var p = [ month, [] ];
		$.each( byNs, function ( ns, c ) {
			p[ 1 ][ nsIdsSortedByNumericValue.indexOf( ns ) ] = c.length;
		} );
		nsData.push( p );
	} );
	window.charts.months( nsData, nsNames, nsColors );
};

/**
 * Show general information such as first edit, longest streak, etc.
 *
 * @private
 */
Inspector.prototype.showGeneral = function () {
	var firstContribDate, latestContribDate, registrationDate, ls;

	if ( this.blockInfo.blockid !== undefined ) {
		this.$general.append(
			'<strong>Currently blocked by ' + this.blockInfo.blockedby + ' with an expiry time of ' +
			this.blockInfo.blockexpiry + ' because "<i>' + this.blockInfo.blockreason + '</i>"<br>'
		);
	}

	firstContribDate = new Date( this.contribs[ 0 ].timestamp );
	latestContribDate = new Date( this.contribs[ this.contribs.length - 1 ].timestamp );

	if ( this.registration !== undefined && this.registration !== null ) {
		registrationDate = new Date( this.registration );

		this.$general.append(
			$( '<a>' )
			.attr( 'href', this.wikipath + 'Special:Log/newusers?user=' + this.user )
			.text( this.i18n( 'registration date' ) ),
			document.createTextNode(
				this.i18n( 'colon-separator' ) +
				registrationDate.toUTCString() +
				this.i18n( 'word-separator' ) +
				this.i18n( 'parentheses',
					this.localizer.dateDiff( registrationDate, new Date(), 4, true )
				)
			),
			'<br>'
		);
	}

	this.$general
	.append(
		'<a href="' + this.wikipath + '?diff=' + this.contribs[ 0 ].revid + '">' +
		this.i18n( 'first edit' ) +
		'</a>' +
		this.i18n( 'colon-separator' ) + firstContribDate.toUTCString() + this.i18n( 'word-separator' ) +
		this.i18n( 'parentheses', this.localizer.dateDiff( firstContribDate, new Date(), 4, true ) ) +
		'<br>'
	)
	.append(
		'<a href="' + this.wikipath + '?diff=' + this.contribs[ this.contribs.length - 1 ].revid + '">' +
		this.i18n( 'most recent edit' ) +
		'</a>' +
		this.i18n( 'colon-separator' ) + latestContribDate.toUTCString() + this.i18n( 'word-separator' ) +
		this.i18n( 'parentheses', this.localizer.dateDiff( latestContribDate, new Date(), 5, true ) ) +
		'<br>'
	)
	.append( 'Live edits: ' + this.contribs.length.toLocaleString() + '<br>' );

	if ( this.editCount !== undefined ) {
		this.$general.append(
			'Deleted edits: ' + ( this.editCount - this.contribs.length ).toLocaleString(),
			'<br>',
			'<b>Total edits (including deleted): ' + this.editCount.toLocaleString() + '</b>',
			'<br>'
		);
	}

	this.$general
	.append(
		'<a href="' + this.wikipath + 'Special:Log/upload?user=' + this.user + '">' +
		this.i18n( 'uploads link' ) +
		'</a>' +
		this.i18n( 'colon-separator' ) + this.uploads.length.toLocaleString() + '<br>'
	);

	ls = this.contribs.longestStreak();

	if ( ls.length === 2 ) {
		this.$general.append(
			this.i18n( 'longest streak' ) + this.i18n( 'colon-separator' ) + ls.map( function ( d ) {
				return new Date( d ).toUTCString();
			} ).join( ' - ' ) +
			this.i18n( 'word-separator' ) +
			this.i18n( 'parentheses',
				this.i18n( 'days',
					( new Date( ls[ 1 ] ).getTime() - new Date( ls[ 0 ] ).getTime() ) / 86400000 + 1
				)
			) +
			'<br>'
		);
	}

	this.$general
	.append(
		this.i18n( 'executed in',
			this.i18n( 'duration-seconds',
				Math.floor( ( new Date().getTime() - this.startDate.getTime() ) / 10 ) / 100
			)
		)
	);
};

/**
 * @typedef {Object} RightsLogEvent
 * @property {number} logid
 * @property {{oldgroups: string[], newgroups: string[]}} params
 * @property {string} timestamp
 */

/**
 * Get a <li> element from a user groups change.
 *
 * @private
 * @param {RightsLogEvent} logevt The log event with params
 * @return {JQuery} The list item
 */
Inspector.prototype.mapRights = function ( logevt ) {
	var oldGroups = logevt.params.oldgroups,
		newGroups = logevt.params.newgroups,
		addedGroups = newGroups.filter( function ( el ) {
			return el !== '' && oldGroups.indexOf( el ) === -1;
		} ),
		removedGroups = oldGroups.filter( function ( el ) {
			return el !== '' && newGroups.indexOf( el ) === -1;
		} ),
		msg = [];
	if ( addedGroups.length > 0 ) {
		msg.push( 'became ' + this.localizer.listToText( addedGroups.map(
			this.localizer.groupColor.bind( this.localizer )
		) ) );
	}
	if ( removedGroups.length > 0 ) {
		msg.push( 'removed ' + this.localizer.listToText( removedGroups.map(
			this.localizer.groupColor.bind( this.localizer )
		) ) );
	}
	return $( '<li>' ).html(
		// Permalink requires commit 1b294bd3c538c874156d9f924200cbf659789dfb in MediaWiki core
		'<a href="' + this.wikipath + 'Special:Redirect/logid/' + logevt.logid + '">' +
		new Date( logevt.timestamp ).toLocaleString() +
		'</a>' + this.i18n( 'colon-separator' ) + this.localizer.listToText( msg )
	);
};

/**
 * Get an <h3> or a <ul> element for the rights tab.
 *
 * @private
 * @param {RightsLogEvent[]} rights Log events
 * @return {JQuery}
 */
Inspector.prototype.getRights = function ( rights ) {
	if ( rights.length === 0 ) {
		return $( '<h3>' ).text( this.i18n( 'no log entries' ) );
	}

	return $( '<ul>' )
		.append( rights.map( this.mapRights.bind( this ) ) );
};

/**
 * Show information about rights changes to the inspected user's account.
 *
 * @private
 * @param {RightsLogEvent[]} rights Log events
 */
Inspector.prototype.showRights = function ( rights ) {
	$( '#rights' ).append( this.getRights( rights ) );

	$( '<span>' )
	.addClass( 'badge' )
	.text( rights.length )
	.appendTo( 'li>a[href="#rights"]' );
};

/**
 * Get a <tr> element for the tags table.
 *
 * @private
 * @param {Object} tagsData Contributions grouped by tag
 * @param {string} tag The name of the tag
 * @return {JQuery} Table row
 */
Inspector.prototype.mapTag = function ( tagsData, tag ) {
	return $( '<tr>' )
		.append(
			$( '<td>' ).text( tag ),
			$( '<td>' ).text( this.localizer.percent(
				tagsData[ tag ].length,
				this.contribs.length
			) )
		);
};

/**
 * Generate the tag table.
 *
 * @private
 */
Inspector.prototype.showTags = function () {
	var tagsData = this.contribs.filterByTag(),
	sortedTagNames = Object.keys( tagsData ).sort( function ( a, b ) {
		return tagsData[ b ].length - tagsData[ a ].length;
	} );

	this.$tagsTable.find( 'tbody' )
	.append( sortedTagNames.map( this.mapTag.bind( this, tagsData ) ) );
};

/**
 * Get information about the use of edit summary by the inspected user.
 *
 * @private
 */
Inspector.prototype.showEditSummary = function () {
	this.$editSummary
	.append(
		$( '<p>' )
		.text(
			this.i18n(
				'edit summary percent',
				this.localizer.percent(
					this.contribs.grepByEditSummary().length,
					this.contribs.length
				)
			)
		)
	);
};

/**
 * Start the inspection.
 *
 * @private
 */
Inspector.prototype.realStart = function () {
	var self = this;
	self.startDate = new Date();
	self.dataGetter.namespaces().done( function ( namespaces ) {
		var toLoadMsgs;
		allNamespaces = self.namespaces = namespaces;
		toLoadMsgs = self.localizer.getEssentialMessages();
		self.dataGetter.rightsLog().done( function ( rights ) {
			rights.forEach( function ( logevt ) {
				var oldGroups = logevt.params.oldgroups,
					newGroups = logevt.params.newgroups;
				oldGroups.concat( newGroups ).forEach( function ( group ) {
					var msg = 'group-' + group + '-member';
					if ( toLoadMsgs.indexOf( msg ) === -1 ) {
						toLoadMsgs.push( msg );
					}
				} );
			} );
			self.localizer.loadMessages( toLoadMsgs ).done( function () {
				$( '[data-msg]' ).each( function () {
					$( this ).text( self.localizer.messages[ this.dataset.msg ] );
				} );
				self.showRights( rights );
				self.dataGetter.contribs().done( function ( contribs ) {
					var hideCreditsOnShow;

					self.contribs = new ContribsList( contribs );
					self.contribs.sort();
					self.contribs.log();
					self.registration = self.dataGetter.registration;
					self.editCount = self.dataGetter.editCount;

					$( '.jumbotron' ).removeClass( 'jumbotron' );
					$( '.container.before-tabs' ).removeClass( 'container' );
					self.$form.remove();
					self.generateNamespacesChart();

					/* Tags table */
					self.showTags();

					/* Programming languages chart */
					self.generateProgrammingLanguagesChart();

					/* GitHub-like Punchcard */
					window.charts.punchcard(
						contribs.toPunchcard(),
						self.localizer.weekdays,
						function ( n ) {
							return self.i18n( 'nedits bold', n );
						}
					);
					hideCreditsOnShow = $( 'li>a[href="#map"],li>a[href="#votes"]' );
					hideCreditsOnShow.on( 'shown.bs.tab', function () {
						$( '#credits' ).hide();
					} );
					$( 'a[data-toggle="tab"]' ).not( hideCreditsOnShow ).on( 'shown.bs.tab', function () {
						$( '#credits' ).show();
					} );
					self.registerMapTab();
					$( 'footer' ).show();
					self.generateMonthsChart();
					self.dataGetter.votes().done( function ( result ) {
						self.showVotes( result );
						self.dataGetter.uploads().done( function ( uploads ) {
							self.uploads = uploads;
							self.dataGetter.blockInfo().done( function ( blockInfo ) {
								self.blockInfo = blockInfo;
								self.showGeneral();
							} );
						} );
						self.showEditSummary();
					} );
				} );
			} );
		} );
	} );
};

/**
 * Called once the site matrix has loaded.
 *
 * @private
 * @param {Object} sites Map of project IDs to URLs
 */
Inspector.prototype.onSiteMatrix = function ( sites ) {
	this.sites = sites;
	this.registerTypeahead();
	this.$form.on( 'submit', this.onSubmit.bind( this ) );
	this.tryPermalink();
};

/**
 * Actually initialize the inspector.
 */
Inspector.prototype.start = function () {
	this.dataGetter.siteMatrix().done( this.onSiteMatrix.bind( this ) );
};

$( document ).ready( function () {
	new Inspector( {
		globalApiUrl: '//meta.wikimedia.org/w/api.php',
		userLanguage: navigator.language,
		$form: $( '#form' ),
		$user: $( '#u' ),
		$project: $( '#p' ),
		$init: $( '#init' ),
		$general: $( '#general' ),
		$topEdited: $( '#top-edited' ),
		$editSummary: $( '#edit-summary' ),
		$tagsTable: $( '#tags-table' ),
		$votes: $( '#votes' )
	} )
	.start();
} );

} )();
