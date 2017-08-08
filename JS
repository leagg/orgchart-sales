
var OMAViz = angular.module('OMAViz', ['OMAViz.people'])

.service('OMAOrgChart', function($rootScope) {
    this.selectedPerson;
    var margin = {
            top: 20,
            right: 120,
            bottom: 20,
            left: 150
        },
        width = window.innerWidth - margin.right - margin.left,
        height = window.innerHeight - margin.top - margin.bottom;
    var i = 0,
        duration = 750,
        root;

    var tree = d3.layout.tree()
        .size([height, width]);

    var diagonal = d3.svg.diagonal()
        .projection(function(d) {
            return [d.y, d.x];
        });

    var colorScale = d3.scale.linear()
        .domain([1, 3, 5])
        .range(['#CF5C60', '#F3AE4E', '#4AB471']);

    var strokeScale = d3.scale.linear()
        .domain([1, 5])
        .range([2, 9]);

    var svg = d3.select("body").append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.json("https://codepen.io/glovelidge/pen/zGGrZJ.js", function(error, flare) {
        console.log(error);
        root = flare;
        root.x0 = height / 2;
        root.y0 = 0;

        function collapse(d) {
            if (d.children) {
                d._children = d.children;
                d._children.forEach(collapse);
                d.children = null;
            }
        }

        root.children.forEach(collapse);
        update(root);
    });

    //d3.select(self.frameElement).style("height", "800px");

    function update(source) {

        // Compute the new tree layout.
        var nodes = tree.nodes(root).reverse(),
            links = tree.links(nodes);

        // Normalize for fixed-depth.
        nodes.forEach(function(d) {
            d.y = d.depth * 180;
        });

        // Update the nodes…
        var node = svg.selectAll("g.node")
            .data(nodes, function(d) {
                return d.id || (d.id = ++i);
            });

        // Enter any new nodes at the parent's previous position.
        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) {
                return "translate(" + source.y0 + "," + source.x0 + ")";
            });

        nodeEnter.append('g')
            .append("circle")
            .attr("r", 1e-6)
            .style("fill", function(d) {
                return d._children ? "#2A94D6" : "#2A94D6";
            })
            .on("click", click);
        
        nodeEnter.append('g')
            .attr('class', function(d) {
                if(!d.relationship) {
                    return 'user-info no-strength';
                } else {
                    return 'user-info';
                }
        	})
            .attr("transform", function(d) {
                return d.children || d._children ? "translate(-30, -20)" : "translate(30, -20)";
            })
        	.on("click", selectUser)
            .append('rect');

        nodeEnter.selectAll('g.user-info')
            .append('text');

        nodeEnter.selectAll('g.user-info text')
            .append('tspan')
            .attr('class', 'user-info__name').attr('x', 0).attr('dy', '1.2em')
            .attr("text-anchor", function(d) {
                return d.children || d._children ? "end" : "start";
            })
            .text(function(d) {
                return d.name;
            })
            .style("fill-opacity", 1);

        nodeEnter.selectAll('g.user-info text')
            .append('tspan')
            .attr('class', 'user-info__role').attr('x', 0).attr('dy', '1.2em')
            .attr("text-anchor", function(d) {
                return d.children || d._children ? "end" : "start";
            })
            .text(function(d) {
                return d.role;
            })
            .style("fill-opacity", .75);

        nodeEnter.selectAll('g.user-info rect')
        	.attr('class', 'container')
            .attr('rx', 3).attr('ry', 3)
            .attr('width', function(d, j, x) {
                var text = d3.selectAll('g.user-info text'),
                    rectWidth = text[0][x].clientWidth;
                return rectWidth + 20;
            })
            .attr('height', function(d, j, x) {
                var text = d3.selectAll('g.user-info text'),
                    rectHeight = text[0][x].clientHeight;
                return rectHeight + 30;
            })
            .attr('x', function(d, j, x) {
                var text = d3.selectAll('g.user-info text'),
                    rectWidth = text[0][x].clientWidth;
                return d.children || d._children ? (rectWidth * -1) - 10 : -10;
            });
        
        nodeEnter.selectAll('g.user-info')
            .append('g')
        	.attr('class', 'influence-container')
        	.attr("transform", function(d, j, x) {
            	console.log(d3.selectAll('g.user-info rect.container')[0][x].height.baseVal.value);
            	var rectContainer = d3.selectAll('g.user-info rect.container')[0][x],
                    x = d.children || d._children ? (rectContainer.width.baseVal.value * -1) + 15 : -5,
                    y = rectContainer.height.baseVal.value - 20;
            	console.log(x,y);
                return "translate(" + x + "," + y + ")";
            })
        	.append('rect')
        	.attr('class', 'influence-outer')
        	.attr('rx', 3).attr('ry', 3)
        	.attr('height', '15')
        	.attr('width', function(d, j, x) {
                var rectContainer = d3.selectAll('g.user-info rect.container'),
                    rectWidth = rectContainer[0][x].getBBox().width - 10;
                return rectWidth;
            })
        
        nodeEnter.selectAll('g.influence-container')
        	.append('rect')
        	.attr('class', 'influence-inner')
        	.attr('rx', 3).attr('ry', 3)
			.attr('height', '11')
        	.attr('x', 2).attr('y', 2)
        	.attr('width', function(d, j, x) {
            	var rectContainer = d3.selectAll('g.user-info rect.container'),
                    rectWidth =  d.influence ? (rectContainer[0][x].getBBox().width - 14) * (d.influence / 5) : 0;
                return rectWidth;
        	})
        	.style('fill', function(d) {
            	return colorScale(d.influence);
	        });
        
        // Transition nodes to their new position.
        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + d.y + "," + d.x + ")";
            });

        nodeUpdate.select("circle")
            .attr("r", 10)
            .style("fill", function(d) {
                return d._children ? "#2A94D6" : "#fff";
            });

        nodeUpdate.select("text")
            .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + source.y + "," + source.x + ")";
            })
            .remove();

        nodeExit.select("circle")
            .attr("r", 1e-6);

        nodeExit.select("text")
            .style("fill-opacity", '#FFF');

        // Update the links…
        var link = svg.selectAll("path.link")
            .data(links, function(d) {
                return d.target.id;
            });

        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function(d) {
                var o = {
                    x: source.x0,
                    y: source.y0
                };
                return diagonal({
                    source: o,
                    target: o
                });
            });

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function(d) {
                var o = {
                    x: source.x,
                    y: source.y
                };
                return diagonal({
                    source: o,
                    target: o
                });
            })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    // Toggle children on click.
    function click(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
        update(d);
    }
    function selectUser(d) {
        var selectedPerson = {};
        selectedPerson.influence = d.influence || 0;
        selectedPerson.name = d.name;
        selectedPerson.relationship = d.relationship || {};
        this.selectedPerson = d;
        $rootScope.$broadcast('selectUser', {'selectedPerson' : selectedPerson});
    }
})

var OMAVizPeople = angular.module('OMAViz.people', [])

.controller('OMAVizPeople', function($scope, OMAOrgChart) {
    $scope.person = OMAOrgChart.selectedPerson;
    $scope.$on('selectUser', function(event, args) {
        $scope.$apply(function() {
            $scope.person = args.selectedPerson;
        })
    })
})
