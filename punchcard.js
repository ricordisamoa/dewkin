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
window.charts.punchcard = function ( data, weekdays, nedits ) {
	var w = document.body.clientWidth - 60,
		h = document.body.clientHeight - 200,
		pad = 30,
		leftPad = 100,
		svg = d3.select( '#punchcard-chart' )
			.append( 'svg' )
			.attr( 'width', w )
			.attr( 'height', h );

	var x = d3.scale.linear().domain( [ 0, 23 ] ).range( [ leftPad, w - pad ] ),
		y = d3.scale.linear().domain( [ 0, 6 ] ).range( [ pad, h - pad * 2 ] ),

		xAxis = d3.svg.axis().scale( x ).orient( 'bottom' )
			.ticks( 24 )
			.tickFormat( function ( d, i ) {
				var m = ( d > 11 ) ? 'p' : 'a';
				return ( d % 12 === 0 ? 12 : d % 12 ) + m;
			} ),
		yAxis = d3.svg.axis().scale( y ).orient( 'left' )
			.ticks( 7 )
			.tickFormat( function ( d, i ) {
				return weekdays[d];
			} ),
		tip = d3.tip()
			.attr( 'class', 'svg-tip' )
			.offset( [ -10, 0 ] )
			.html( function ( d ) {
				return nedits( d[2] );
			} );

	svg.append( 'g' )
		.attr( 'class', 'axis x-axis' )
		.attr( 'transform', 'translate(0, ' + ( h - pad ) + ')' )
		.call( xAxis );

	svg.append( 'g' )
		.attr( 'class', 'axis y-axis' )
		.attr( 'transform', 'translate(' + ( leftPad - pad ) + ', 0)' )
		.call( yAxis );

	svg.call( tip );

	var maxR = d3.max( data, function ( d ) { return d[2]; } ),
		r = d3.scale.sqrt()
			.domain( [ 0, maxR ] )
			.range( [ 0, 18 ] );

	$( 'li>a[href="#punchcard"]' ).on( 'shown.bs.tab', function () {
		svg.selectAll( 'circle' )
			.data( data )
			.enter()
			.append( 'circle' )
			.attr( 'cx', function ( d ) { return x( d[1] ); } )
			.attr( 'cy', function ( d ) { return y( d[0] ); } )
			.attr( 'r', 0 )
			.on( 'mouseover', tip.show )
			.on( 'mouseout', tip.hide )
			.transition()
			.duration( 250 )
			.attr( 'r', function ( d ) { return r( d[2] ); } );
	} );
};
