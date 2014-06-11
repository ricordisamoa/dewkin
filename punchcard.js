window.charts.punchcard = function(data, weekdays, nedits){
	var w = document.body.clientWidth - 60,
		h = document.body.clientHeight - 200,
		pad = 30,
		left_pad = 100,
		svg = d3.select('#punchcard-chart')
			.append('svg')
			.attr('width', w)
			.attr('height', h);

	var x = d3.scale.linear().domain([0, 23]).range([left_pad, w-pad]),
		y = d3.scale.linear().domain([0, 6]).range([pad, h-pad*2]),

		xAxis = d3.svg.axis().scale(x).orient('bottom')
			.ticks(24)
			.tickFormat(function (d, i) {
				var m = (d > 11) ? 'p' : 'a';
				return (d % 12 == 0 ? 12 : d % 12) + m;
			}),
		yAxis = d3.svg.axis().scale(y).orient('left')
			.ticks(7)
			.tickFormat(function (d, i) {
				return weekdays[d];
			}),
		tip = d3.tip()
			.attr('class', 'svg-tip')
			.offset([-10, 0])
			.html(function(d) {
				return nedits(d[2]);
			});

	svg.append('g')
		.attr('class', 'axis x-axis')
		.attr('transform', 'translate(0, ' + (h - pad) + ')')
		.call(xAxis);

	svg.append('g')
		.attr('class', 'axis y-axis')
		.attr('transform', 'translate(' + (left_pad - pad) + ', 0)')
		.call(yAxis);

	svg.call(tip);

	var max_r = d3.max(data.map(function (d) { return d[2]; })),
		r = d3.scale.sqrt()
			.domain([0, d3.max(data, function (d) { return d[2]; })])
			.range([0, 18]);

	$('li>a[href="#punchcard"]').on('shown', function(){
		svg.selectAll('circle')
			.data(data)
			.enter()
			.append('circle')
			.attr('cx', function (d) { return x(d[1]); })
			.attr('cy', function (d) { return y(d[0]); })
			.attr('r', 0)
			.on('mouseover', tip.show)
			.on('mouseout', tip.hide)
			.transition()
			.duration(400)
			.attr('r', function (d) { return r(d[2]); });
	});
};
