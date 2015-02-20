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
window.charts.months = function ( data, namespaces, colors ) {

	var n = namespaces.length,
		m = data.length,

		margin = {
			top: 40,
			right: 200,
			bottom: 30,
			left: 90
		},
		width = document.body.clientWidth - 80 - margin.left - margin.right,
		height = ( 700 / 28 * m ) - margin.top - margin.bottom,

		stack = d3.layout.stack(),
		layers = stack( d3.range( n ).map( function ( d ) {
			var a = [];
			for ( var i = 0; i < m; ++i ) {
				a[i] = {
					ns: namespaces[d],
					x: i,
					y: data[i][1][d]
				};
			}
			return a;
		} ) ),

		yGroupMax = d3.max( layers, function ( layer ) {
				return d3.max( layer, function ( d ) {
					return d.y;
				} );
			} ),
		yStackMax = d3.max( layers, function ( layer ) {
				return d3.max( layer, function ( d ) {
					return d.y0 + d.y;
				} );
			} ),

		x = d3.scale.linear()
			.domain( [ 0, yStackMax ] )
			.range( [ 0, width ] ),

		y = d3.scale.ordinal()
			.domain( d3.range( m ) )
			.rangeRoundBands( [ 0, height ], 0.2 ),

		xAxis = d3.svg.axis()
			.scale( x )
			.orient( 'bottom' ),

		// year and month number
		yAxis = d3.svg.axis()
			.scale( y )
			.orient( 'left' )
			.tickFormat( function ( d, i ) { return data[i][0]; } ),

		// total month count
		yAxis2 = d3.svg.axis()
			.scale( y )
			.orient( 'left' )
			.tickFormat( function ( d, i ) { return d3.sum( data[i][1] ); } ),

		tip = d3.tip()
			.attr( 'class', 'svg-tip svg-tip-small' )
			.direction( 'e' )
			.offset( [ 0, 6 ] )
			.html( function ( d, i ) {
				return d.ns + ': ' + d.y;
			} ),

		svg = d3.select( '#month-chart' )
				.append( 'svg' )
				.attr( 'width', width + margin.left + margin.right )
				.attr( 'height', height + margin.top + margin.bottom )
			.append( 'g' )
				.attr( 'transform', 'translate(' + margin.left + ',' + margin.top + ')' );

	svg.call( tip );

	svg.append( 'g' )
			.attr( 'class', 'x axis' )
			.attr( 'transform', 'translate(0,' + height + ')' )
			.call( xAxis );

	svg.append( 'g' )
			.attr( 'class', 'y axis noticks' )
			.attr( 'text-anchor', 'end' )
			.attr( 'transform', 'translate(-35)' )
			.call( yAxis );

	svg.append( 'g' )
			.attr( 'class', 'y axis' )
			.call( yAxis2 );

	var layer = svg.selectAll( '.layer' )
		.data( layers )
	.enter().append( 'g' )
		.attr( 'class', 'layer' )
		.attr( 'fill', function ( d, i ) { return colors[i]; } );

	layer.selectAll( '.bar' )
			.data( function ( d ) { return d; } )
		.enter().append( 'rect' )
			.attr( 'class', 'bar' )
			.attr( 'y', function ( d ) { return y( d.x ); } )
			.attr( 'x', function ( d ) { return x( d.y0 ); } )
			.attr( 'height', y.rangeBand() )
			.attr( 'width', function ( d ) { return x( d.y ); } )
			.on( 'mouseover', tip.show )
			.on( 'mouseout', tip.hide );

};
