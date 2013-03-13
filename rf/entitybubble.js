/**
 * 
 */
var 
	//dataset specific variables
	dataFile =    '../data/recfuture/entityyear.csv',
	articlesDir = '../data/recfuture/byyear/', 
	xAxisFieldName = 'date',
	yAxisFieldName = 'entity',
	labelFieldName = 'count',
	xAxisFormat = d3.time.format("%Y"),
	initArticleYearIndex = 11,  //1999
	initArticleEntityIndex = 6, //obesity
	
	//visualization specific variables
	entities = null,
	xscale = null,
	yscale = null,
	graph = null,
	margin = {top: 20, right: 80, bottom: 30, left: 100},
	width = 800 - margin.left - margin.right,
	height = 400 - margin.top - margin.bottom,
	termTableWidth = 100,
	termTableHeight = 200,
	tableHeight = 200,	
	articlesTerm = "",	
	articlesTime = null,
	lineColor = 'white',
	tooltip = null;

function draw(data) {
	"use strict";

	var color = d3.scale.linear().domain([0,100]).range(['cyan','rgb(34,94,168)']);
	
	//add body svg
	var svg = d3.select("body").append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	      .on("mousemove", bodymousemove())
		.append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	//mouse position lines
	//horizontal
	d3.select('svg')
		.append('line')
			.attr('id', 'horline')
			.attr('x1', margin.left)
			.attr('y1', 0)
			.attr('x2', width + margin.left)
			.attr('y2', 0)
			.style('stroke', 'rgb(16,16,16)');
	//vertical
	d3.select('svg')
		.append('line')
			.attr('id', 'vertline')
			.attr('x1', 0)
			.attr('y1', 0 + margin.top)
			.attr('x2', 0)
			.attr('y2', height + margin.top)
			//dark gray so that it's subtle against the black background
			.style('stroke', 'rgb(16,16,16)');  
	
	//dataset
	//convert the dates from strings to dates
	data.forEach(function(d) { d[xAxisFieldName] = xAxisFormat.parse(d[xAxisFieldName]); });		
	//structure the dataset so that it is an array of entities
	entities = d3.nest() 
		.key(function(d){return d[yAxisFieldName];})
		.entries(data);    

	//add x axis, x axis is a time scale
	xscale = d3.time.scale()
    	.range([0, width]);
	var xAxis = d3.svg.axis()
    	.scale(xscale)
    	.orient("bottom");
	xscale.domain(d3.extent(data, function(d) { return d[xAxisFieldName]; }));
	svg.append("g")
		.attr("class", "x axis")
	    .attr("transform", "translate(0," + height + ")")
	    .call(xAxis);
		
	//add y axis
	yscale = d3.scale.ordinal()
	  	.rangeRoundBands([height, 0], 1);
	var yAxis = d3.svg.axis()
	   	.scale(yscale)
	   	.orient("left");
	var minCount =
		d3.min(entities, function(e) { return d3.min(e.values, function(v) { return +v[yAxisFieldName]; }); });
	var maxCount = 
	  	d3.max(entities, function(e) { return d3.max(e.values, function(v) { return +v[yAxisFieldName];});});
	//the entities
	var names = entities.map(function(d) { return d.key; });
	yscale.domain(names);
	svg.append("g")
		.attr("class", "y axis")
	    .call(yAxis)
	    .append("text")
	    .attr("transform", "rotate(-90)")
	    .attr("y", 6)
	    .attr("dy", ".71em")
	    .style("text-anchor", "end")
	    .text("Entities");
	
	//add data to the graph
	graph = svg.selectAll(".entity")
		.data(entities)
	    .enter().append("g")
	      .attr("class", "entity");

	//add the dots
	svg.selectAll('.dot')
		.data(data)
		.enter().append('circle')
			.attr('class', 'dot')
			.attr('r', 6)
			.attr('cx', function(d) {return xscale(d[xAxisFieldName]);})
			.attr('cy', function(d) {
				return yscale(d[yAxisFieldName]);})
			.style('fill', function(d) {return color(d[labelFieldName]);})
			.style('stroke', 'black')
			.on('mouseover', mouseover())
			.on('mouseout', mouseout())
			.on('click', mouseclick());
	
	//the articles table we init with the first entries in the dataset
	articlesTerm = entities[initArticleEntityIndex].key;
	articlesTime = entities[initArticleEntityIndex].values[initArticleYearIndex][xAxisFieldName];
	articlesTime = xAxisFormat(articlesTime);
	var articlesFileName = articlesDir + articlesTime + '.csv';
	//open the file for this date and search for the term
	d3.csv(articlesFileName, addArticlesList);	

	};   //end of draw
	
	//methods to handle mouse/touch events
	//draw mouse tracker lines to show where the axis ticks are
	function bodymousemove() {
		return function(g,i) {
			if (entities){
				var entityData = entities[0];
				entityData = entityData.values;
				
				//for horizontal line, find closest point on y axis
				var mousey = d3.mouse(this)[1];
				var closestOnYScale = 
					getClosestOnScale(d3.mouse(this)[1] - margin.top, yscale, yAxisFieldName);
				closestOnYScale += margin.top;
				var lineH = document.getElementById("horline");
				lineH.setAttribute("y1", closestOnYScale);
				lineH.setAttribute("y2", closestOnYScale);			
				
				//for vertical line, find closest point on x axis
				var mousex = d3.mouse(this)[0];
				var closestOnXScale = 
					getClosestOnScale(d3.mouse(this)[0] - margin.left, xscale, xAxisFieldName);
				closestOnXScale += margin.left;
	        	var lineV = document.getElementById("vertline");
				lineV.setAttribute("x1", closestOnXScale);
				lineV.setAttribute("x2", closestOnXScale);
				lineV.setAttribute("y1", closestOnYScale);
				
				lineH.setAttribute("x2", closestOnXScale);
				
			}
		};
	}
	
	function getClosestOnScale(mouse, scale, field) {
		//loop through the data, find the date closest
		var onscaleClosest = null,
			closestDiff = Number.MAX_VALUE;
		entities.forEach(function(d,i){
			var entityData = entities[i].values;
			entityData.forEach(function(d, i){
				var onscale = scale(d[field]);
				var diff = Math.abs(mouse - onscale);
				if (diff < closestDiff){
					closestDiff = diff;
					onscaleClosest = onscale;
				}
			});
		});
		return onscaleClosest;		
	}

	function getClosestXIndex(entityData, mouse) {
		var iclosest = 0;
		var closestDiff = Number.MAX_VALUE;
		//loop through the data, find the date closest
		var row = null,
			onscale = null,
			onscaleClosest = null,
			diff = null;
		entityData.forEach(function(d, i){
			onscale = xscale(d[xAxisFieldName]);
			diff = Math.abs(mouse - onscale);
			if (diff < closestDiff){
				iclosest = i;
				closestDiff = diff;
			}
		});
		return iclosest;
	}
	
	
	function addArticlesList(dataArticles) {
		if (articlesTerm.length == 0)
			return;
		var articlesToUse = dataArticles.filter(function(d) {
			return d[yAxisFieldName] === articlesTerm;
		});
		var articlesDiv = d3.select("body")
			.append("div")
			.attr("id","articleslist")
			.style("float", "bottom")
			.style("color", "white")
			;
		articlesDiv.append("h3")
			.text(articlesToUse.length + " fragments mentioning " + articlesTime + " have the entity '" + 
					articlesTerm + "'");
		var articlesTableDiv = 
			articlesDiv.append("div")
				.style("overflow", "auto")
				.style("height", "150px");
		articlesTable =
			articlesTableDiv.append("table")
			.selectAll("tr")
			.data(articlesToUse)
			.enter()
			.append("tr")
				.append("td")
				.text(function(d) { return d.title; })
				.append("td")
				.text(function(d) { return d.fragment;});
		}
	
	
	//add tooltip and highlight the current line (dim all the others)
	var saveColor = null;
	function mouseover(){
		return function(g,i) {
			if (tooltip)
				tooltip.Show(d3.event, 
						g[yAxisFieldName] + ' ' + 
						xAxisFormat(g[xAxisFieldName]) + '<br>Count: ' + g[labelFieldName] 
						);
			graph
				.filter(function(h,j){ 
					return j != i; 
					})
				.style("opacity", .1);
			this.parentNode.appendChild(this);
		};
	}
	
	//hide tooltip and remove highlight
	function mouseout() {
		return function(g,i){
			if (tooltip)
				tooltip.Hide(d3.event);
			graph
				.style("opacity", 1);
		};
	}
	
	function mouseclick() {
		return function(g,i) {
			//if the division is already there, remove it
			var div = d3.selectAll("[id = articleslist]");  
			if (div)
				div.remove();
			articlesTerm = g[yAxisFieldName];
			articlesTime = xAxisFormat(g[xAxisFieldName]);
			var articlesFileName = articlesDir + articlesTime + '.csv';
			//open the file for this date and search for the term
			d3.csv(articlesFileName, addArticlesList);	
		};		
	}

	//a test to see if the browser supports this functionality
	//  if it's unsupported, an error will be thrown here
	function maptest() {
		var arrayIn = [ 2, 4, 6];
		var arrayOut = arrayIn.map(function(d) { return d + 2; });
		d3.selectAll('p');
	}
	
