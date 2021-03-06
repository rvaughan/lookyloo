// From : https://bl.ocks.org/d3noob/43a860bc0024792f8803bba8ca0d5ecd

// Set the dimensions and margins of the diagram
var margin = {top: 20, right: 200, bottom: 30, left: 90},
    width = 9600 - margin.left - margin.right,
    height = 10000 - margin.top - margin.bottom;

var node_width = 0;
var node_height = 45;

var hostnode_tooltip = d3.select("body").append("div")
                            .attr("class", "tooltip")
                            .style("opacity", 0);

var init = d3.select("body").append("svg")
            .attr("width", width + margin.right + margin.left)
            .attr("height", height + margin.top + margin.bottom)

// Add background pattern
var pattern = init.append("defs").append('pattern')
    .attr('id', 'backstripes')
    .attr('x', margin.left)
    .attr("width", node_width * 2)
    .attr("height", 10)
    .attr('patternUnits', "userSpaceOnUse" )

pattern.append('rect')
    .attr('width', node_width)
    .attr('height', height)
    .attr("fill", "#EEEEEE");

var background = init.append('rect')
    .attr('y', 0)
    .attr('width', width)
    .attr('height', height)
    .style('fill', "url(#backstripes)")
    .on('click', function(d) {
        hostnode_tooltip.transition()
            .duration(500)
            .style("opacity", 0)
            .style("z-index", -10);
    });

// append the svg object to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var svg = init.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var i = 0,
    duration = 750,
    root;

// declares a tree layout and assigns the size
var treemap = d3.tree().size([height, width]);

// Assigns parent, children, height, depth
root = d3.hierarchy(treeData, function(d) { return d.children; });
root.x0 = height / 2;
root.y0 = 0;

// Collapse after the second level
// root.children.forEach(collapse);

update(root);


// Collapse the node and all it's children
function collapse(d) {
  if(d.children) {
    d._children = d.children
    d._children.forEach(collapse)
    d.children = null
  }
}

function getBB(selection) {
    selection.each(function(d) {
        d.data.total_width = d.data.total_width ? d.data.total_width : 0;
        d.data.total_width += this.getBBox().width;
    })
}

function urlnode_click(data) {
    var url = "url/" + data['uuid'];
    d3.json(url, function(error, u) {
        if (error) throw error;
        console.log(u)
    })
}


function hostnode_click(d) {
    // Modal display
    var url = "hostname/" + d.data.uuid;
    var pageX=d3.event.pageX;
    var pageY=d3.event.pageY;
    hostnode_tooltip.selectAll("ul").remove();
    d3.json(url, function(error, urls) {
          if (error) throw error;
          hostnode_tooltip.transition()
            .duration(200)
            .style("opacity", .9)
            .style("z-index", 1)
            .style("left", (pageX) + "px")
            .style("top", (pageY - 28) + "px");
          var list = hostnode_tooltip.append('ul')
            .attr("class", "list-group");
          urls.forEach(function(url){
            var jdata = JSON.parse(url)
            var entry = list.append('li')
                .attr("class", "list-group-item")
                .attr("url_uuid", jdata['uuid'])
                .text(jdata['name']);
                //.on('click', function(){urlnode_click(jdata)});
        })
    });
}

function update(source) {

  // reinitialize max_depth
  var max_depth = 1

  // Update height
  // 50 is the height of a node, 500 is the minimum so the root node isn't behind the icon
  var newHeight = Math.max(treemap(root).descendants().reverse().length * node_height, 10 * node_height);
  treemap = d3.tree().size([newHeight, width]);

  // Assigns the x and y position for the nodes
  var treeData = treemap(root);

  // Compute the new tree layout.
  var nodes = treeData.descendants(),
      links = treeData.descendants().slice(1);


  // ****************** Nodes section ***************************

  // Update the nodes...
  // TODO: set that ID to the ete3 node ID
  var node = svg.selectAll('g.node')
      .data(nodes, function(d) {return d.id || (d.id = ++i); });

    // Enter any new modes at the parent's previous position.
  var nodeEnter = node.enter().append('g')
      .attr('class', 'node')
      .attr("transform", function(d) {
        return "translate(" + source.y0 + "," + source.x0 + ")";
    });

  // Add Circle for the nodes
  nodeEnter.append('circle')
      .attr('class', 'node')
      .attr('r', 1e-6)
      .style("fill", function(d) {
          return d._children ? "lightsteelblue" : "#fff";
      })
      .on('click', click);

  // Avoid hiding the content after the circle
  var nodeContent = nodeEnter
        .append('svg')
        .attr('height',node_height)
        .attr('x', 10)
        .attr('y', -20);

  // Add labels for the nodes
  var text_nodes = nodeContent.append("text")
        .attr('dy', '.9em')
        .attr("stroke", "white")
        .style("font-size", "16px")
        .attr("stroke-width", ".2px")
        .style("opacity", .9)
        .text(function(d) {
            d.data.total_width = 0; // reset total_width
            return d.data.name;
        })
        .on('click', hostnode_click);

  // This value has to be set once for all for the whole tree and cannot be updated
  // on click as clicking only updates a part of the tree
  if (node_width === 0) {
    text_nodes.each(function(d) {
      node_width = node_width > this.getBBox().width ? node_width : this.getBBox().width;
    })
    node_width += 20;
  };

  // Normalize for fixed-depth.
  nodes.forEach(function(d){ d.y = d.depth * node_width});
  // Update pattern
  init.selectAll('pattern')
    .attr('width', node_width * 2)
  pattern.selectAll('rect')
    .attr('width', node_width)

  // Update svg width
  nodes.forEach(function(d){
      if (d.children){
        max_depth = d.depth > max_depth ? d.depth : max_depth;
      }
  });
  var newWidth = Math.max((max_depth + 2) * node_width, node_width);
  background.attr('height', newHeight + margin.top + margin.bottom)
  background.attr('width', newWidth + margin.right + margin.left)
  treemap.size([newHeight, newWidth])
  d3.select("body svg")
    .attr("width", newWidth + margin.right + margin.left)
    .attr("height", newHeight + margin.top + margin.bottom)

  // Put all the icone in one sub svg document
  var icons = nodeEnter
        .append('svg')
        .attr('x', 10)
        .attr('y', 10);

  // Add JavaScript information
  var jsContent = icons
        .append('svg');

  jsContent.filter(function(d){
      return d.data.js > 0;
  }).append('image')
      .attr("width", 16)
      .attr("height", 16)
      .attr('x', function(d) { return d.data.total_width ? d.data.total_width + 1 : 0 })
      .attr("xlink:href", "/static/javascript.png").call(getBB);

  jsContent.filter(function(d){
     return d.data.js > 0;
  }).append('text')
    .attr("dy", 8)
    .attr('x', function(d) { return d.data.total_width ? d.data.total_width + 1 : 0 })
    .attr('width', function(d) { return d.data.js.toString().length + 'em'; })
    .text(function(d) { return d.data.js; }).call(getBB);


  // Add Cookie read information
  var cookieReadContent = icons
        .append('svg');

  cookieReadContent.filter(function(d){
    return d.data.request_cookie > 0;
  }).append('image')
	  .attr("width", 16)
	  .attr("height", 16)
      .attr('x', function(d) { return d.data.total_width ? d.data.total_width + 1 : 0 })
	  .attr("xlink:href", "/static/cookie_read.png").call(getBB);

  cookieReadContent.filter(function(d){
     return d.data.request_cookie > 0;
  }).append('text')
    .attr("dy", 8)
    .attr('x', function(d) { return d.data.total_width ? d.data.total_width + 1 : 0 })
    .attr('width', function(d) { return d.data.request_cookie.toString().length + 'em'; })
    .text(function(d) { return d.data.request_cookie; }).call(getBB);

  // Add Cookie set information
  var cookieSetContent = icons
        .append('svg');

  cookieSetContent.filter(function(d){
    return d.data.response_cookie > 0;
  }).append('image')
	  .attr("width", 16)
	  .attr("height", 16)
      .attr('x', function(d) { return d.data.total_width ? d.data.total_width + 1 : 0 })
	  .attr("xlink:href", "/static/cookie_received.png").call(getBB);

  cookieSetContent.filter(function(d){
     return d.data.response_cookie > 0;
  }).append('text')
    .attr("dy", 8)
    .attr('x', function(d) { return d.data.total_width ? d.data.total_width + 1 : 0 })
    .attr('width', function(d) { return d.data.response_cookie.toString().length + 'em'; })
    .text(function(d) { return d.data.response_cookie; }).call(getBB);

  // Add redirect information
  var redirectContent = icons
        .append('svg');

  redirectContent.filter(function(d){
    return d.data.redirect > 0;
  }).append('image')
  	  .attr("width", 16)
  	  .attr("height", 16)
      .attr('x', function(d) { return d.data.total_width ? d.data.total_width +1 : 0 })
  	  .attr("xlink:href", "/static/redirect.png").call(getBB);

  redirectContent.filter(function(d){
     return d.data.redirect > 0;
  }).append('text')
    .attr("dy", 8)
    .attr('x', function(d) { return d.data.total_width ? d.data.total_width + 2 : 0 })
    .attr('width', function(d) { return d.data.redirect.toString().length + 'em'; })
    .text(function(d) { return d.data.redirect; }).call(getBB);

  // Add cookie in URL information
  var cookieURLContent = icons
        .append('svg');

  cookieURLContent.filter(function(d){
    return d.data.redirect_to_nothing > 0;
  }).append('image')
      .attr("width", 16)
      .attr("height", 16)
      .attr('x', function(d) { return d.data.total_width ? d.data.total_width + 1 : 0 })
      .attr("xlink:href", "/static/cookie_in_url.png").call(getBB);

    cookieURLContent.filter(function(d){
       return d.data.redirect_to_nothing > 0;
    }).append('text')
      .attr("dy", 8)
      .attr('x', function(d) { return d.data.total_width ? d.data.total_width + 1 : 0 })
      .text(function(d) { return d.data.redirect_to_nohing; }).call(getBB);

  // UPDATE
  var nodeUpdate = nodeEnter.merge(node);

  // Transition to the proper position for the node
  nodeUpdate.transition()
    .duration(duration)
    .attr("transform", function(d) {
        return "translate(" + d.y + "," + d.x + ")";
     });

  // Update the node attributes and style
  nodeUpdate.select('circle.node')
    .attr('r', 10)
    .style("fill", function(d) {
        return d._children ? "lightsteelblue" : "#fff";
    })
    .attr('cursor', 'pointer');


  // Remove any exiting nodes
  var nodeExit = node.exit().transition()
      .duration(duration)
      .attr("transform", function(d) {
          return "translate(" + source.y + "," + source.x + ")";
      })
      .remove();

  // On exit reduce the node circles size to 0
  nodeExit.select('circle')
    .attr('r', 1e-6);

  // On exit reduce the opacity of text labels
  nodeExit.select('text')
    .style('fill-opacity', 1e-6);

  // ****************** links section ***************************

  // Update the links...
  var link = svg.selectAll('path.link')
      .data(links, function(d) { return d.id; });

  // Enter any new links at the parent's previous position.
  var linkEnter = link.enter().insert('path', "g")
      .attr("class", "link")
      .attr('d', function(d){
        var o = {x: source.x0, y: source.y0}
        return diagonal(o, o)
      });

  // UPDATE
  var linkUpdate = linkEnter.merge(link);

  // Transition back to the parent element position
  linkUpdate.transition()
      .duration(duration)
      .attr('d', function(d){ return diagonal(d, d.parent) });

  // Remove any exiting links
  var linkExit = link.exit().transition()
      .duration(duration)
      .attr('d', function(d) {
        var o = {x: source.x, y: source.y}
        return diagonal(o, o)
      })
      .remove();

  // Store the old positions for transition.
  nodes.forEach(function(d){
    d.x0 = d.x;
    d.y0 = d.y;
  });

  // Creates a curved (diagonal) path from parent to the child nodes
  function diagonal(s, d) {

    path = `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`

    return path
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
}
