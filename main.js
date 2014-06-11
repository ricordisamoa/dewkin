/*

DEep WiKi INspector (DEWKIN)
Copyright (C) 2013-2014 Ricordisamoa

meta.wikimedia.org/wiki/User:Ricordisamoa
tools.wmflabs.org/ricordisamoa/

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.

*/
/* jshint smarttabs: true */
/* global $, Raphael */
(function(){
'use strict';

/*
 * @class
 * @extends Array
 */
var ContribsList = (function(){

/*
 * @constructor
 */
function ContribsList(){
	var args = Array.prototype.slice.call(arguments);

	if(args.length === 1 && $.isArray(args[0])){
		var list = args[0];
	}
	else{
		var list = Object.create(Array.prototype);
		list = (Array.apply(list, arguments) || list);
	}

	for (var method in ContribsList.prototype){
		if (ContribsList.prototype.hasOwnProperty(method)){
			list[method] = ContribsList.prototype[method];
		}
	}
	return list;
}

ContribsList.prototype = {

	/*
	 * sort the items by timestamp, in ascending order
	 */
	sort: function(){
		return ContribsList(Array.prototype.sort.call(this, function(a, b){
			var ts1 = new Date(a.timestamp),
			ts2 = new Date(b.timestamp);
			return ((ts1 < ts2) ? -1 : ((ts1 > ts2) ? 1 : 0));
		}));
	},

	log: function(){
		console.log(this);
	},

	filterByNamespace: function(alsoEmpty){
		var contr = {},
		self = this;
		$.each($.map(vars.namespaces, function(e){
			return e;
		}), function(nsIndex, ns){
			var f = self.grepByNamespace(ns.id);
			if(f.length > 0 || alsoEmpty === true){
				contr[ns.id] = f;
			}
		});
		return contr;
	},

	filterByDay: function(){
		var contr = {};
		for(var j = 0; j < 7; j++){
			contr[j] = this.grepByDay(j);
		}
		return contr;
	},

	filterByHour: function(){
		var contr = [];
		for(var j = 0; j < 24; j++){
			contr.push(this.grepByHour(j));
		}
		return contr;
	},

	filterByTag: function(){
		var contr = {},
		self = this;
		$.each(self, function(i, e){
			if(e.tags && e.tags.length === 1){
				if(contr[e.tags[0]]){
					contr[e.tags[0]].push(e);
				}
				else{
					contr[e.tags[0]] = [e];
				}
			}
			else if(!e.tags || e.tags.length === 0){
				if(contr.none){
					contr.none.push(e);
				}
				else{
					contr.none = [e];
				}
			}
		});
		return {
			legend: $.map(Object.keys(contr), function(tag){
				var l = contr[tag].length;
				return tag + i18n('colon-separator') + util.percent(l, self.length, undefined, i18n('tags-hitcount', l));
			}),
			data: $.map(Object.keys(contr), function(tag){
				return contr[tag].length;
			})
		};
	},

	filterByMonth: function(){
		var contr = {},
		s = {};
		$.each(this, function(i, e){
			var date = new Date(e.timestamp),
			code = util.yearMonth(date);
			if(contr[code]){
				contr[code].push(e);
			}
			else{
				contr[code] = [e];
			}
		});
		$.each(util.allMonths(), function(i, e){
			if(contr[e]){
				s[e] = contr[e];
			}
			else{
				s[e] = [];
			}
		});
		return s;
	},

	filterByMonthAndNamespace: function(){
		var contr = {};
		$.each(this.filterByMonth(), function(k, v){
			contr[k] = ContribsList(v).filterByNamespace(true);
		});
		return contr;
	},

	filterByNamespaceAndMonth: function(){
		var contr = {};
		$.each(this.filterByNamespace(true), function(k, v){
			contr[k] = ContribsList(v).filterByMonth();
		});
		return contr;
	},

	filterByProgrammingLanguage: function(){
		var contr = {};
		$.each(this, function(i, c){
			var lang;
			if(c.ns === 828){ // Scribunto modules
				lang = 'lua';
			}
			else if([2, 8].indexOf(c.ns) !== -1){
				var m = c.title.toLowerCase().match(/\.(js|css)$/);
				if(m !== null){
					lang = m[1];
				}
				else if(c.ns === 2 && /\.py$/.test(c.title)){
					lang = 'py';
				}
			}
			if(lang){
				if(!contr[lang]){
					contr[lang] = ContribsList();
				}
				contr[lang].push(c);
			}
		});
		return contr;
	},

	grepByEditSummary: function(summary){
		return ContribsList($.grep(this, function(e){
			if(e.comment){
				if(!summary && e.comment !== ''){
					return e;
				}
				else if(summary && e.comment === summary){
					return e;
				}
			}
			if(!summary){
				return e;
			}
		}));
	},

	grepByNamespace: function(ns){
		return ContribsList($.grep(this, function(e){
			return (typeof ns === 'number') ? (e.ns === ns) : (ns.indexOf(e.ns) !== -1);
		}));
	},

	grepByDay: function(number){
		return ContribsList($.grep(this, function(e){
			return new Date(e.timestamp).getUTCDay() === number;
		}));
	},

	grepByHour: function(number){
		return ContribsList($.grep(this, function(e){
			return new Date(e.timestamp).getUTCHours() === number;
		}));
	},

	topEdited: function(ns){
		var c = this;
		if(ns){
			c = c.grepByNamespace(ns);
		}
		var titles = $.map(c, function(e){
			return [e.title];
		}),
		occurr = {};
		$.each(titles, function(i, e){
			if(occurr[e]){
				occurr[e] = occurr[e] + 1;
			}
			else{
				occurr[e] = 1;
			}
		});
		var sortedKeys = Object.keys(occurr).sort(function(a, b){
			return ((occurr[a] > occurr[b]) ? -1 : ((occurr[a] < occurr[b]) ? 1 : 0));
		}),
		overflow = false;
		if(sortedKeys.length > 30){
			overflow = true;
			sortedKeys = sortedKeys.slice(0, 30);
		}
		var sortedOccurr = {};
		$.each(sortedKeys, function(i, e){
			sortedOccurr[e] = occurr[e];
		});
		return [sortedOccurr, overflow];
	},

	toPunchcard: function(){
		var data = [];
		for(var d = 0; d < 7; d++){
			data = data.concat($.map(this.grepByDay(d).filterByHour(), function(c){
				return c.length;
			}));
		}
		return data;
	},

	/* Compute the longest sequence of consecutive days with contributions
	*/
	longestStreak: function(){
		var prev = [],
		cur = [],
		cc = ContribsList(this.slice(0)),
		sameOrNext = function(d1, d2){
			return d1 === d2 || (d2 - d1 === 86400000);
		};
		cc.sort();
		$.each(cc, function(i, ct){
			var d = new Date(ct.timestamp).setHours(0, 0, 0, 0);
			if(cur.length === 0){
				cur[0] = d;// start streak
			}
			else if(cur.length === 1){
				if(sameOrNext(cur[0], d)){
					cur[1] = d;// continue streak
				}
				else{
					cur = [];
				}
			}
			else if(cur.length === 2){
				if(i < cc.length && sameOrNext(cur[1], d)){
					cur[1] = d;// continue streak
				}
				else{// streak broken
					if(prev.length === 0 || cur[1] - cur[0] > prev[1] - prev[0]){
						prev = cur;// (over)write longest streak
					}
					cur = [];// reset current streak anyway
				}
			}
		});
		return prev;
	}
 
};

return ContribsList;

}).call({});

var getData = {

	allUsers: function(prefix, localApi, callback){
		var api = vars.globalApi,
		params = {
			action: 'query',
			format: 'json'
		};
		if(localApi && localApi.trim() !== ''){
			api = localApi;
			params = $.extend(params, {
				list: 'allusers',
				auwitheditsonly: 1,
				auprefix: prefix,
				aulimit: 8,
				prop: ''
			});
		}
		else{
			params = $.extend(params, {
				list: 'globalallusers',
				aguprefix: prefix,
				agulimit: 8,
				aguprop: ''
			});
		}
		$.get(
			api,
			params,
			function(data){
				callback(data.query[Object.keys(data.query)[0]]);
			},
			'jsonp'
		);
	},

	siteMatrix: function(callback){
		$.get(
			vars.globalApi,
			{
				action: 'sitematrix',
				format: 'json',
				smsiteprop: 'dbname|url',
				smlangprop: 'site'
			},
			function(data){
				var dbNames = {};
				$.each(data.sitematrix, function(){
					$.each(this.site || ($.isArray(this) ? this : []), function(){
						if(this.dbname && this.url && this['private'] === undefined && this.fishbowl === undefined){
							dbNames[this.dbname] = this.url.replace(/^http\:\/\//, '//');
						}
					});
				});
				callback(dbNames);
			},
			'jsonp'
		);
	},

	namespaces: function(callback){
		$.get(
			vars.api,
			{
				action: 'query',
				meta: 'siteinfo',
				siprop: 'namespaces',
				format: 'json'
			},
			function(b){
				var ns = b.query.namespaces;
				delete ns['-1'];
				callback(ns);
			},
			'jsonp'
		);
	},

	uploads: function(callback, aistart){
		$.get(
			vars.api,
			$.extend(
				{
					action: 'query',
					format: 'json',
					list: 'allimages',
					aiprop: '',
					aisort: 'timestamp',
					aiuser: vars.user,
					ailimit: 'max'
				},
				(aistart !== undefined && aistart !== '' ? {aistart: aistart} : {})
			),
			function(data){
				vars.uploads = vars.uploads.concat($.map(data.query.allimages, function(e){
					return [e.name.replace(/_/g, ' ')];
				}));
				if(data['query-continue'] && data['query-continue'].allimages && data['query-continue'].allimages.aistart){
					getData.uploads(vars.user, callback, data['query-continue'].allimages.aistart);
				}
				else{
					callback(vars.uploads);
					return;
				}
			},
			'jsonp'
		);
	},

	contribs: function(callback, cont){
		var params = {
			action: 'query',
			format: 'json',
			list: 'usercontribs',
			ucuser: vars.user,
			ucprop: 'title|timestamp|comment|tags|ids|sizediff',
			uclimit: 'max'
		};
		if(cont !== undefined){
			$.extend(params, cont);
		}
		else{
			params.list += '|users';
			params.ususers = vars.user;
			params.usprop = 'editcount';
		}
		$.get(
			vars.api,
			params,
			function(data){
				vars.contribs = vars.contribs.concat(data.query.usercontribs);
				if(data.query.users){
					vars.editcount = data.query.users[Object.keys(data.query.users)[0]].editcount;
				}
				if(data['query-continue'] && data['query-continue'].usercontribs){
					getData.contribs(callback, data['query-continue'].usercontribs);
				}
				else{
					callback(vars.contribs);
					return;
				}
			},
			'jsonp'
		);
	}, 

	messages: function(lang, msgs, callback){
		$.get(
			vars.api,
			{
				action: 'query',
				format: 'json',
				meta: 'allmessages',
				amlang: lang,
				ammessages: msgs.join('|')
			},
			function(data){
				vars.messages = {};
				$.each(data.query.allmessages || [], function(i, v){
					vars.messages[v.name] = v['*'];
				});
				util.loadCustomMessages(lang, callback);
			},
			'jsonp'
		);
	},

	rightsLog: function(callback){
		$.get(
			vars.api,
			{
				action: 'query',
				format: 'json',
				list: 'logevents',
				letype: 'rights',
				letitle: 'User:' + vars.user,
				ledir: 'newer',
				lelimit: 'max'
			},
			function(data){
				callback($.grep(data.query.logevents, function(el){
					// hack for old log entries
					return el.rights !== undefined;
				}));
			},
			'jsonp'
		);
	},

	blockInfo: function(callback){
		$.get(
			vars.api,
			{
				action: 'query',
				format: 'json',
				list: 'users',
				ususers: vars.user,
				usprop: 'blockinfo'
			},
			function(data){
				var blk = data.query.users[0];
				callback(blk || {});
			},
			'jsonp'
		);
	},

	votes: function(){
		return $.getJSON('//tools.wmflabs.org/octodata/sucker.php', {
			action: 'votelookup',
			username: vars.user,
			groupby: 'ballot'
		});
	},

	geoData: function(contribs, callback){
		var occurr = {};
		$.each(contribs, function(key, val){
			if(occurr[val.title]){
				if(occurr[val.title].revid){
					occurr[val.title] = {
						count: 2,
						sizediff: occurr[val.title].sizediff + val.sizediff
					};
				}
				else{
					occurr[val.title].count += 1;
					occurr[val.title].sizediff += val.sizediff;
				}
			}
			else{
				occurr[val.title] = val;
			}
		});
		var geodata = {},
		titles = Object.keys(occurr),
		getGeodata = function(cb){
			$.get(
				vars.api,
				{
					action: 'query',
					prop: 'coordinates',
					format: 'json',
					titles: titles.splice(0, 50).join('|')
				},
				function(data){
					$.extend(geodata, data.query.pages);
					if(titles.length > 0){
						getGeodata(cb);
					}
					else{
						cb(geodata);
					}
				},
				'jsonp'
			);
		};
		getGeodata(function(coords){
			var markers = [];
			$.each(coords, function(pageid, page){
				if(page.coordinates){
					var coordinates = page.coordinates;
					if(coordinates.length === 1){
						coordinates = coordinates[0];
						var edits = occurr[page.title],
						numedits = (edits.count || 1),
						marker = {
							coords: coordinates,
							title: page.title,
							sizediff: edits.sizediff,
							numedits: numedits
						};
						if(edits.revid){
							$.extend(marker, {revid: edits.revid});
						}
						markers.push(marker);
					}
				}
			});
			markers.sort(function(a, b){
				return b.numedits - a.numedits;
			});
			callback(markers);
		});
	}

};

var util = {

	dateDiff: function(olddate, newdate, precision, ago){
		var labels = [
			'years',
			'months',
			'weeks',
			'days',
			'hours',
			'minutes',
			'seconds'
		],
		mult = [12, 4.34, 7, 24, 60, 60, 1000],
		diff = (newdate || new Date()) - olddate,
		message = [];
		$.each(mult, function(i, e){
			if(precision === undefined || precision === null || i <= precision || message.length === 0){
				var f = parseInt(mult.slice(i).reduce(function(a, b){
					return a * b;
				}));
				if(Math.floor(diff / f) > 0){
					message.push(i18n(labels[i], Math.floor(diff / f)));
					diff -= Math.floor(diff / f) * f;
				}
			}
		});
		return message.length > 0 ? (ago === true ? i18n('ago', util.listToText(message)) : util.listToText(message)) : i18n('just-now');
	},

	/* canonical day and month names to load MediaWiki translated messages */
	weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
	weekdaysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
	months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],

	yearMonth: function(date){
		var month = (date.getUTCMonth() + 1).toString();
		if(month.length === 1){
			month = '0' + month;
		}
		return date.getUTCFullYear() + '/' + month;
	},

	/*
	 * Set of HEX colors by MediaWiki namespace number
	 * from Soxred93's Edit Counter - Copyright (C) 2010 Soxred93 - under the terms of the GNU General Public License
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

	colorFromNamespace: function(ns){
		return '#' + (this.namespaceColors[ns] || 'CCC');
	},

	namespaceFromColor: function(color){
		color = color.toLowerCase().replace(/^\#/, '');
		for(var ns in this.namespaceColors){
			if(this.namespaceColors[ns].toLowerCase() === color){
				return ns;
			}
		}
	},

	/*
	@see https://github.com/github/linguist/blob/master/lib/linguist/languages.yml
	*/
	programmingLanguages: {
		'css': ['CSS', '563d7c'],
		'js':  ['JavaScript', 'f1e05a'],
		'lua': ['Lua', 'fa1fa1'],
		'py':  ['Python', '3581ba']
	},

	markerColors: ['bisque', 'black', 'blue', 'coral', 'cyan', 'darkslategray', 'deeppink', 'green',
				   'lightgrey', 'lime', 'magenta', 'orange', 'purple', 'red', 'teal', 'yellow'],

	/*
	 * A 'span' or 'strong' HTML element for a given sizediff
	 */
	sizediffIndicator: function(sizediff){
		var sizedifftag = Math.abs(sizediff) > 500 ? 'strong' : 'span';
		return '<' + sizedifftag + ' class="mw-plusminus-' + (sizediff === 0 ? 'null' : (sizediff > 0 ? 'pos' : 'neg')) + '">' + (sizediff > 0 ? '+' : '') + i18n('size-bytes', sizediff) + '</' + sizedifftag + '>';
	},

	/*
	 * Set of arbitrary HTML colors by MediaWiki user group
	 */
	groupsColors: {
		'autopatrolled':	'dodgerblue',
		'rollbacker':		'darkolivegreen',
		'filemover':		'orange',
		'translationadmin':	'orangered',
		'sysop':			'darkred',
		'bureaucrat':		'darkviolet',
		'checkuser':		'darkslategray',
		'oversight':		'navy',
		'steward':			'black'
	},

	groupColor: function(group){
		var local = (vars.messages['group-' + group + '-member'] || group);
		return util.groupsColors[group] ? ('<span style="background-color:' + util.groupsColors[group] + ';color:white">' + local + '</span>') : local;
	},

	namespaceName: function(number){
		return vars.namespaces[number] ? vars.namespaces[number]['*'].replace(/^(Talk)?$/, 'Article $1').trim() : ('ns-' + number);
	},

	allMonths: function(from){
		if(from === undefined){
			from = vars.firstMonth;
		}
		from = from.split('/');
		var fromYear = parseInt(from[0]),
		fromMonth = parseInt(from[1]) - 1,
		months = [],
		toYear = new Date().getUTCFullYear(),
		toMonth = new Date().getUTCMonth();
		for(var year = fromYear; year <= toYear; year++){
			for(var month = (year === fromYear ? fromMonth : 0); month <= (year === toYear ? toMonth : 11); month++){
				var m = (month + 1).toString();
				months.push(year + '/' + (m.length === 1 ? '0' : '') + m);
			}
		}
		return months;
	},

	listToText: function(array){
		var comma = i18n('comma-separator'),
		sep = i18n('word-separator'),
		and = i18n('and');
		switch(array.length){
			case 0: return '';
			case 1: return array[0];
			case 2: return array.join(sep + and + sep);
			default: return array.slice(0, -1).join(comma) + comma + and + sep + array[array.length - 1];
		}
	},

	percent: function(num, outof, precision, format){
		if(precision === undefined){
			precision = 2;
		}
		return (format || num.toLocaleString()) + i18n('word-separator') + i18n('parentheses', i18n('percent', parseFloat((num / outof * 100).toFixed(precision))));
	},

	loadCustomMessages: function(lang, callback){
		var self = this;
		$.get('i18n/' + lang + '.json', {}, 'jsonp')
		.done(function(data){
			$.extend(vars.messages, data);
			callback(true);
		})
		.fail(function(){
			if(lang === 'en'){
				callback(false);
			}
			else{
				self.loadCustomMessages('en', callback);
			}
		});
	},

	parseMsg: function(msg){
		var regex = /(^|[^\/])\$(\d+)(?=\D|$)/g,
		regex2 = new RegExp(regex.source, ''),
		args = Array.prototype.slice.call(arguments);
		msg = msg.replace(regex, function(el){
			var m = el.match(regex2);
			if(m && args[parseInt(m[2])] !== undefined){
				return m[1] + args[parseInt(m[2])];
			}
			else{
				return el;
			}
		});
		regex = /\{\{PLURAL\:(\d+(\.\d+)?)\|([^\|]*)(\|([^\|]*))?\}\}/g;
		regex2 = new RegExp(regex.source, '');
		msg = msg.replace(regex, function(el){
			var m = el.match(regex2);
			if(m){
				return parseFloat(m[1]) === 1 ? m[3] : (m[5] || m[3]);
			}
			else{
				return el;
			}
		});
		return msg;
	}

},

vars = {
	globalApi: '//meta.wikimedia.org/w/api.php',
	contribs: [],
	uploads: [],
	userLang: navigator.language
},

i18n = function(msg){
	var params = Array.prototype.slice.call(arguments);
	params[0] = vars.messages[msg];
	return util.parseMsg.apply(this, params);
};

$(document).ready(function(){

	getData.siteMatrix(function(sites){

		vars.sites = sites;

		// suggestions while typing "User name"
		$('#u').typeahead({
			source: function(query, process){
				getData.allUsers(query, $('#p').val().trim() !== '' && vars.sites[$('#p').val()] ? (vars.sites[$('#p').val()] + '/w/api.php') : '', function(users){
					return process($.map(users, function(user){
						return user.name;
					}));
				});
			}
		});

		// suggestions while typing "Project"
		$('#p').typeahead({
			source: function(query, process){
				process(Object.keys(vars.sites));
			}
		});

		$('#form').on('submit', function(event){
			event.preventDefault();
			vars.wikipath = vars.sites[$('#p').val()] + '/wiki/';
			vars.api = vars.sites[$('#p').val()] + '/w/api.php';
			vars.user = $('#u').val().replace(/_/g, ' ');
			if(window.history.pushState && window.location.pathname.split(/[^\/]\/[^\/]/).length === 1){
				window.history.pushState({}, '', window.location.pathname.replace(/\/$/, '') + '/' + vars.user.replace(/ /g, '_') + '@' + $('#p').val());
			}
			$(this)
			.children('button')
			.attr('data-loading-text', 'Loading...')
			.button('loading')
			.siblings()
			.remove();
			(function(){
				var dewkinInitDate = new Date();
				getData.namespaces(function(namespaces){
					vars.namespaces = namespaces;
					var toLoadMsgs = $('[data-msg]').map(function(){
						return this.dataset.msg;
					}).get()
					// time-related messages
					.concat(['ago', 'just-now', 'seconds', 'duration-seconds', 'minutes', 'hours', 'days', 'weeks', 'months', 'years'])
					// miscellaneous
					.concat(['and', 'comma-separator', 'colon-separator', 'word-separator', 'parentheses', 'percent', 'diff',
							 'nchanges', 'size-bytes', 'tags-hitcount'])
					.concat(util.weekdays)
					.concat(util.weekdaysShort)
					.concat(util.months);
					getData.rightsLog(function(rights){
						$.each(rights, function(i, logevt){
							var oldGroups = logevt.rights.old.split(', '),
							newGroups = logevt.rights.new.split(', ');
							$.each(oldGroups.concat(newGroups), function(i, group){
								var msg = 'group-' + group + '-member';
								if(toLoadMsgs.indexOf(msg) === -1){
									toLoadMsgs.push(msg);
								}
							});
						});
						getData.messages(vars.userLang, toLoadMsgs, function(){
							util.months = $.map(util.months, function(el){
								return vars.messages[el];
							});
							util.weekdays = $.map(util.weekdays, function(el){
								return vars.messages[el];
							});
							util.weekdaysShort = $.map(util.weekdaysShort, function(el){
								return vars.messages[el];
							});
							$('[data-msg]').each(function(){
								$(this).text(vars.messages[this.dataset.msg]);
							});
							$('#rights')
							.append(
								rights.length === 0 ? '<h3>No log entries found.</h3>' : $('<ul>')
								.append($.map(rights, function(logevt){
									var oldGroups = logevt.rights.old.split(', '),
									newGroups = logevt.rights.new.split(', '),
									addedGroups = $.grep(newGroups, function(el){
										return el !== '' && oldGroups.indexOf(el) === -1;
									}),
									removedGroups = $.grep(oldGroups, function(el){
										return el !== '' && newGroups.indexOf(el) === -1;
									}),
									msg = [];
									if(addedGroups.length > 0){
										msg.push('became ' + util.listToText($.map(addedGroups, util.groupColor)));
									}
									if(removedGroups.length > 0){
										msg.push('removed ' + util.listToText($.map(removedGroups, util.groupColor)));
									}
									return $('<li>').html('<a href="' + vars.wikipath + 'Special:Log/' + logevt.logid + '">' + new Date(logevt.timestamp).toLocaleString() + '</a>' + i18n('colon-separator') + util.listToText(msg));
								}))
							);
							$('<span>')
							.addClass('badge')
							.text(rights.length)
							.appendTo('li>a[href="#rights"]');
							getData.contribs(function(contribs){
								vars.contribs = ContribsList(contribs);
								vars.contribs.sort();
								contribs = vars.contribs;
								contribs.log();
								var firstContribDate = new Date(contribs[0].timestamp),
								latestContribDate = new Date(contribs[contribs.length -1].timestamp),
								filtered = contribs.filterByNamespace(true),
								sortedNsNumbers = Object.keys(filtered).sort(function(a, b){
									return filtered[b].length - filtered[a].length;
								}),
								nsNames = $.map(sortedNsNumbers, function(ns){
									return util.namespaceName(ns) + i18n('colon-separator') + util.percent(filtered[ns].length, contribs.length);
								}),
								nsContribs = $.map(sortedNsNumbers, function(ns){
									return filtered[ns].length;
								}),
								nsColors = $.map(sortedNsNumbers, function(ns){
									return util.colorFromNamespace(ns);
								});
								vars.firstMonth = util.yearMonth(firstContribDate);
								$('.hero-unit').removeClass('hero-unit');
								$('#form').remove();
								var nsCanvas = Raphael('ns-chart', 520, 400),
								nsChart = nsCanvas.piechart(170, 200, 150, nsContribs, { legend: nsNames, legendpos: 'east', colors: nsColors, minPercent: 0 })
								.hover(function () {
									this.sector.stop();
									if(!this.sector[0].classList.contains('selected')) this.sector.scale(1.1, 1.1, this.cx, this.cy);
									if (this.label) {
										this.label[0].stop();
										this.label[0].attr({ r: 7.5 });
										this.label[1].attr({ 'font-weight': 800 });
									}
								}, function () {
									if(!this.sector[0].classList.contains('selected')) this.sector.animate({ transform: 's1 1 ' + this.cx + ' ' + this.cy }, 500, 'bounce');
									if (this.label) {
										this.label[0].animate({ r: 5 }, 500, 'bounce');
										this.label[1].attr({ 'font-weight': 400 });
									}
								})
								.click(function () {
									this.sector.stop();
									this.sector.attr({transform:'s1 1 ' + this.cx + ' ' + this.cy });
									if(this.sector[0].classList.contains('selected')){
										this.sector[0].classList.remove('selected');
										$('#top-edited').hide('fast');
										nsCanvas.canvas.setAttribute('width', 520);
									}
									else{
										nsCanvas.canvas.setAttribute('width', 340);
										nsChart.each(function(){
											this.sector.attr({transform:'s1 1 ' + this.cx + ' ' + this.cy });
											this.sector[0].classList.remove('selected');
										});
										this.sector.scale(1.1, 1.1, this.cx, this.cy);
										this.sector[0].classList.add('selected');
										var ns = sortedNsNumbers[this.value.order],
										te = contribs.topEdited(ns);
										$('#top-edited')
										.empty()
										.append(
											$('<h2>')
											.text(i18n((te[1] ? 'top ': '') + 'edited in ns', Object.keys(te[0]).length, util.namespaceName(ns)))
										)
										.append(
											$('<ul>').append(
												$.map(te[0], function(v, k){
													return $('<a>')
													.text(k)
													.attr('href', vars.wikipath + k)
													.appendTo('<li>' + v + ' - </li>')
													.parent();
												})
											)
										).show('fast');
									}
								} ) ;
								var dayColors = ['#4d89f9', '#c6d9fd'],
								dayFiltered = $.map(contribs.filterByDay(), function(e){
									return e.length;
								});
								while(dayColors.length < dayFiltered.length){
									dayColors = dayColors.concat(dayColors.slice(0, 2)).slice(0, dayFiltered.length);
								}
								var weekCanvas = Raphael('week-chart'),
								fin = function () {
									this.flag = weekCanvas.popup(this.bar.x, this.bar.y, this.bar.value || '0', 'up').insertBefore(this);
								},
								fin2 = function () {
									this.flag = weekCanvas.popup(this.bar.x, this.bar.y, util.namespaceName(util.namespaceFromColor(this.bar.attrs.fill)) + ': ' + this.bar.value || '0', 'right').insertBefore(this);
								},
								fout = function () {
									this.flag.animate({opacity: 0}, 100, function () {
										this.remove();
									});
								},
								weekChart = weekCanvas.barchart(0, 20, 400, 300, dayFiltered, { colors: dayColors }).hover(fin, fout);

								/* Tags chart */
								$('li>a[href="#tags"]').one('shown', function(){
									var tagsData = contribs.filterByTag(),
									tagsCanvas = Raphael('tag-chart', 750, 600),
									tagsChart = tagsCanvas.piechart(220, 220, 180, tagsData.data, { legend: tagsData.legend, minPercent: 0 });
								});

								/* Programming languages chart */
								var langs = contribs.filterByProgrammingLanguage(),
								sortedLangExts = Object.keys(langs).sort(function(a, b){
									return langs[b].length - langs[a].length;
								}),
								langNames = $.map(sortedLangExts, function(ext){
									return util.programmingLanguages[ext][0];
								}),
								langContribs = $.map(sortedLangExts, function(ext){
									return langs[ext].length;
								}),
								langColors = $.map(sortedLangExts, function(ext){
									return '#' + util.programmingLanguages[ext][1];
								});
								$('li>a[href="#code"]').one('shown', function(){
									var codeCanvas = Raphael('code-chart', 520, 400),
									codeChart = codeCanvas.piechart(170, 200, 150, langContribs, { legend: langNames, legendpos: 'east', colors: langColors, minPercent: 0 })
									.hover(function () {
										this.sector.stop();
										this.sector.scale(1.1, 1.1, this.cx, this.cy);
										if (this.label) {
											this.label[0].stop();
											this.label[0].attr({ r: 7.5 });
											this.label[1].attr({ 'font-weight': 800 });
										}
									}, function () {
										this.sector.animate({ transform: 's1 1 ' + this.cx + ' ' + this.cy }, 500, 'bounce');
										if (this.label) {
											this.label[0].animate({ r: 5 }, 500, 'bounce');
											this.label[1].attr({ 'font-weight': 400 });
										}
									});
								});

								/* GitHub-like Punchcard */
								$('li>a[href="#punchcard"]').one('shown', function(){
									var r = Raphael('punchcard-chart', 1200, 500),
									xs = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
									ys = [7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
									r.dotchart(10, 0, 1200, 500, xs, ys, contribs.toPunchcard(), {
										symbol: 'o',
										max: 21,
										axis: '0 0 1 1',
										axisxstep: 23,
										axisystep: 6,
										axisxlabels: ['12am', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12pm', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
										axisxtype: ' ',
										axisytype: ' ',
										axisylabels: util.weekdays.slice().reverse(),
										init: true
									}).hover(function () {
										var self = this,
										s = $('circle').filter(function(){
											return parseInt(self.x) === parseInt(this.getAttribute('cx')) && parseInt(self.y) === parseInt(this.getAttribute('cy'));
										});
										try{
											s.get(0).classList.add('day-hover');
											s.get(1).style.zIndex = 0;
											this.flag = r.popup(this.x, this.y - this.r, i18n('nchanges', this.value) || '0', 'up', 8).insertBefore(this);
										}
										catch(e){
										}
									}, function () {
										var self = this,
										s = $('circle').filter(function(){
											return parseInt(self.x) === parseInt(this.getAttribute('cx')) && parseInt(self.y) === parseInt(this.getAttribute('cy'));
										});
										try{
											s.get(0).classList.remove('day-hover');
											s.get(1).style.zIndex = null;
											this.flag.animate({opacity: 0}, 100, function () {this.remove();});
										}
										catch(e){
										}
									});
								});
								var hideCreditsOnShow = $('li>a[href="#map"],li>a[href="#votes"]');
								hideCreditsOnShow.on('show', function(){
									$('#credits').hide();
								});
								$('a[data-toggle="tab"]').not(hideCreditsOnShow).on('show', function(){
									$('#credits').show();
								});
								$('li>a[href="#map"]')
								.one('shown', function(){
									$('#map').append('Loading geodata...');
									getData.geoData(contribs.grepByNamespace([0, 6]), function(geodata){
										if(geodata.length > 0){
											$('#map').empty().css('height', '400px');
											var maxedits = geodata[0].numedits,
											map = L.map('map').setView([0, 0], 2);
											new L.TileLayer(
												'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
												{
													minZoom: 2,
													maxZoom: 18,
													attribution: 'Map data © <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
												}
											)
											.addTo(map);
											$.each(geodata, function(index, marker){
												var sizediff = util.sizediffIndicator(marker.sizediff),
												iconSize = Math.max(9, marker.numedits / maxedits * 22);
												if(marker.revid){
													var edits = '<a href="' + vars.wikipath + '?diff=' + marker.revid + '">' + i18n('nchanges', '1') + '</a>';
												}
												else{
													var edits = i18n('nchanges', marker.numedits);
												}
												L.marker(marker.coords, {
													icon: L.icon({
														iconUrl: '//commons.wikimedia.org/wiki/Special:Filepath/Location_dot_' + util.markerColors[Math.floor(Math.random() * util.markerColors.length)] + '.svg',
														iconSize: [iconSize, iconSize]
													})
												}).addTo(map).bindPopup('<strong><a href="' + vars.wikipath + marker.title + '">' + marker.title + '</a></strong><br>' + i18n('bytes with nchanges', sizediff, edits));
											});
										}
										else{
											$('#map').empty().append(i18n('no geodata'));
										}
									});
								});
								$('footer').show();
								var byMonth = contribs.filterByMonth(),
								axisData = $.map(Object.keys(byMonth), function(e){
									return byMonth[e].length.toString();
								}).reverse(),
								filtered = contribs.filterByNamespaceAndMonth(),
								nsNumbers = Object.keys(filtered),
								nsNames = $.map(nsNumbers, function(e){
									return util.namespaceName(e);
								}),
								nsData = $.map(filtered, function(months){
									return [$.map(months, function(c){
										return c.length;
									})];
								}),
								nsColors = $.map(nsNumbers, function(ns){
									return util.colorFromNamespace(ns);
								}),
								axisLabels = Object.keys(filtered[Object.keys(filtered)[0]]).reverse(),
								mSize = 24.5 * Object.keys(byMonth).length,
								monthsCanvas = Raphael('month-chart', 1200, mSize),
								monthsChart = monthsCanvas.hbarchart(75, 0, 850, mSize, nsData, { stacked: true, colors: nsColors }).hover(fin2, fout);
								$('li>a[href="#advanced"]').one('shown', function(){
									Raphael.g.axis(31, 320, 331, 0, 7, 6, 2, util.weekdaysShort, ' ', null, weekCanvas);
									var aY = monthsChart.bars[0][monthsChart.bars[0].length - 1].y,
									aH = aY - monthsChart.bars[0][0].y;
									console.log(aY + '\n' + aH);
									console.log(monthsChart.bars[0]);
									Raphael.g.axis(50, aY - 1.8, aH, 0, axisLabels.length, axisLabels.length - 1, 1, axisLabels, ' ', null, monthsCanvas)
									.text.attr({'font-weight': 'bold'});
									Raphael.g.axis(60, aY - 1.8, aH, 0, axisData.length, axisData.length - 1, 1, axisData, ' ', null, monthsCanvas)
									.text.attr({'text-anchor': 'start'});
								});
								var ls = contribs.longestStreak(),
								summ = contribs.grepByEditSummary().length;
								getData.votes().done(function(result){
									$('#votes')
									.append($.map(result.votelookup.ballots, function(poll){
										return [
											$('<h3>').append($('<a>', {'href': poll.b_url, 'title': poll.b_title}).text(poll.b_title)),
											poll.votes.length > 0 ? $('<ul>')
											.append($.map(poll.votes, function(vote){
												return $('<li>')
												.html(
													i18n(
														'voted for',
														new Date(vote.vt_timestamp).toUTCString(),
														vote.s_name,
														$('<a>')
														.attr({
															'href': poll.b_project + '?diff=' + vote.vt_diff,
															'title': i18n('diff on project', vote.vt_diff, poll.b_project)
														})
														.text(i18n('diff'))
														.get(0).outerHTML
													)
												);
											})) : i18n('did not vote')
										];
									}));
									getData.uploads(function(uploads){
										getData.blockInfo(function(blockinfo){
											$('#general')
											.append(blockinfo.blockid !== undefined ? ('<strong>Currently blocked by ' + blockinfo.blockedby + ' with an expiry time of ' + blockinfo.blockexpiry + ' because "<i>' + blockinfo.blockreason + '</i>"<br>') : '')
											.append('<a href="' + vars.wikipath + '?diff=' + contribs[0].revid + '">' + i18n('first edit') + '</a>' + i18n('colon-separator') + firstContribDate.toUTCString() + i18n('word-separator') + i18n('parentheses', util.dateDiff(firstContribDate, new Date(), 4, true)) + '<br>')
											.append('<a href="' + vars.wikipath + '?diff=' + contribs[contribs.length -1].revid + '">' + i18n('most recent edit') + '</a>' + i18n('colon-separator') + latestContribDate.toUTCString() + i18n('word-separator') + i18n('parentheses', util.dateDiff(latestContribDate, new Date(), 5, true)) + '<br>')
											.append('Live edits: ' + contribs.length.toLocaleString() + '<br>')
											.append(vars.editcount === undefined ? [] : ['Deleted edits: ' + (vars.editcount - contribs.length).toLocaleString(), '<br>',
											'<b>Total edits (including deleted): ' + vars.editcount.toLocaleString() + '</b>', '<br>'])
											.append('<a href="' + vars.wikipath + 'Special:Log/upload?user=' + vars.user + '">' + i18n('statistics-files') + '</a>' + i18n('colon-separator') + uploads.length.toLocaleString() + '<br>')
											.append(
												ls.length === 2 ?
												(
													i18n('longest streak') + i18n('colon-separator') + $.map(ls, function(d){
														return new Date(d).toUTCString();
													}).join(' - ') + i18n('word-separator') + i18n('parentheses', i18n('days', (new Date(ls[1]) - new Date(ls[0])) / 86400000 + 1)) + '<br>'
												) : ''
											)
											.append(i18n('executed in', i18n('duration-seconds', Math.floor((new Date().getTime() - dewkinInitDate.getTime()) / 10) / 100)));
										});
									});
									$('#edit-summary')
									.append(
										$('<p>')
										.text(i18n('edit summary percent', util.percent(summ, contribs.length)))
									);
								});
							});
						});
					});
				});
			})();
		});
		var path = window.location.pathname.split('/');
		if(path.length === 3){
			var inspData = path[2].split('@');
			if(inspData.length === 2){
				$('#u').val(inspData[0]);
				$('#p').val(inspData[1]);
				$('#form').submit();
			}
		}
	});
});

})();
