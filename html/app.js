"use strict";
var c = [],
    filter = {},
    data={},
    options = {
      size:2,
      animated:true,
      '# mapped':1000,
      Opacity:50
    };

var map = L.map('map').setView([63.63, -19.5], 10)
    .on("moveend",refresh);

var mapboxGreyUrl = 'http://{s}.tiles.mapbox.com/v3/cartodb.map-1nh578vv/{z}/{x}/{y}.png'
var mapboxGrey = new L.TileLayer(mapboxGreyUrl, {attribution: 'Map tiles by <a href="http://mapbox.com/about/maps/">Mapbox</a>'});
var cloudmadeUrl = 'http://{s}.tile.cloudmade.com/3d487eb6127d4b68adb916f293fa4785/{styleId}/256/{z}/{x}/{y}.png', cloudmadeAttribution = 'Map data &copy; 2012 OpenStreetMap contributors, Imagery &copy; 2012 CloudMade';
var mapquestUrl = 'http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png',subDomains = ['otile1','otile2','otile3','otile4'], mapquestAttrib = 'Data, imagery and map information provided by <a href="http://open.mapquest.co.uk" target="_blank">MapQuest</a>,<a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> and contributors.'
var mapquest = new L.TileLayer(mapquestUrl, {attribution: mapquestAttrib, subdomains: subDomains});
var minimal = new L.TileLayer(cloudmadeUrl, {attribution: cloudmadeAttribution, styleId: 22677});
var midnightCommander = new L.TileLayer(cloudmadeUrl, {attribution: cloudmadeAttribution, styleId: 999}).addTo(map);
var cloudmadeoriginal = new L.TileLayer(cloudmadeUrl, {attribution: cloudmadeAttribution, styleId: 1});
var osm = new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'Map data by <a target="_top" href="http://openstreetmap.org">OpenStreetMap</a>, under <a target="_top" href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>'});
var mapboxTerrainUrl = 'http://{s}.tiles.mapbox.com/v3/examples.map-4l7djmvo/{z}/{x}/{y}.png'
var mapboxTerrain = new L.TileLayer(mapboxTerrainUrl, {attribution: 'Map tiles by <a href="http://mapbox.com/about/maps/">Mapbox</a>'});
var LMI = L.tileLayer.wms("http://gis.lmi.is/arcgis/services/kort_isn93/atlas100r_isn93/MapServer/WMSServer",{layers:0,attribution:'Underlying maps © <a href="http://www.lmi.is/wp-content/uploads/2013/01/GeneralTermsNLSI.pdf">National Land Survey of Iceland</a>'});
var StamenTonerurl = 'http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png'
var StamenToner = new L.TileLayer(StamenTonerurl, {attribution: 'Map tiles</a> by <a target="_top" href="http://stamen.com">Stamen Design</a>, under <a target="_top" href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a target="_top" href="http://openstreetmap.org">OpenStreetMap</a>, under <a target="_top" href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>'});
var StamenWatercolorurl = 'http://{s}.tile.stamen.com/watercolor/{z}/{x}/{y}.png'
var StamenWatercolor = new L.TileLayer(StamenWatercolorurl, {attribution: 'Map tiles</a> by <a target="_top" href="http://stamen.com">Stamen Design</a>, under <a target="_top" href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a target="_top" href="http://openstreetmap.org">OpenStreetMap</a>, under <a target="_top" href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>'});

map.attributionControl.setPrefix("");

var baseMaps = {
     "Mapbox-Terrain": mapboxTerrain,
    "Mapbox-grey": mapboxGrey,
    "Mapquest": mapquest,
    "OSM": osm,
    "Minimal - Cloudmade": minimal,
    "MidnightCommander - Cloudmade": midnightCommander,
    "Original - Cloudmade": cloudmadeoriginal,
    "LMI":LMI,
    "Stamen watercolor": StamenWatercolor,
    "Stamen toner": StamenToner,
  };

  var layersControl = new L.Control.Layers(baseMaps);

    map.addControl(layersControl);

// Calling _initPathRoot generates an SVG inside the leaflet DIV
map._initPathRoot();

var mapsvg = d3.select("#map").select("svg").append("g");

function addChart(dim,title,scale) {
  var div = d3.select("#charts")
      .append("svg").attr("height",110).attr("width",250)
      .attr("class","chart")
      .attr("id",dim);

  var brush = d3.svg.brush()
      .x(scale);

  var chart = n3.chart(div)
      .showAxes(["x"])
      .margin({top:25,bottom:5,left:5,right:5})
      .setTitle("chart",title)
      .setTitle("y2_top","")
      .scale("x",scale)
      .axis("x",function(d) { d.ticks(6); })
      .resize()  // must resize to have the right height for the brush
      .on("resize.autofit2",function() {
        var nodes = chart.graph.selectAll(":not(.exiting)");
        nodes.call(n3.fitScale("y"));
        brush.x(scale);
      });

  chart.g.select(".y2_top").datum().style.dy = "-0.2em";
  var height = chart.scale("y").range();

  chart.overlay.append("g").attr("class", "brush")
    .call(brush)
    .selectAll("rect")
    .attr("y",height[1])
    .attr("height",height[0]-height[1]);

  brush.on("brushend",function() {
      var extent  = brush.extent();
      if (+extent[0] == +extent[1]) {
        chart.setTitle("y2_top","");
        delete filter[dim];
      } else {
        chart.setTitle("y2_top","[ "+rangeFormat(extent[0])+" - "+rangeFormat(extent[1])+" ]");
        filter[dim] = extent;
      }
      refresh();
  });

  function rangeFormat(d) {
    return   (d < 1000)  ? d3.format(".2r")(d) : d3.time.format("%m/%d/%y")(d);
  }

  chart.refresh = function() {
    data[dim]=data[dim].slice(1);
    var width = (data[dim][2].x-data[dim][1].x)*0.9;
    chart.graph.selectAll("rect").data(data[dim].map(function(d) { return {x0:d.x,y:d.y,y1:d.y,y0:0,width:width};}))
      .call(function(d) { d.enter().append("rect").classed("bars",true); })
      .call(function(d) { d.exit().remove(); });
    chart.render();
  };

  c.push(chart);
}

var color = d3.scale.linear().range(["orange","red"]).domain([0,10]);

function refresh() {

  var b=map.getBounds();
  d3.select("#loading").style("visibility","visible");

  filter.lat = [b._southWest.lat,b._northEast.lat];
  filter.lng = [b._southWest.lng,b._northEast.lng];

  var z = mapsvg.selectAll(".markers")
    .attr("cx",function(d) { return map.latLngToLayerPoint(d.LatLng).x; })
    .attr("cy",function(d) { return map.latLngToLayerPoint(d.LatLng).y; });

  d3.json("/eq?filter="+JSON.stringify(filter)+"&num="+options['# mapped'],function(err,d) {
    data = d;
    data.dt.forEach(function(d) { d.x = new Date(d.x); });
    data.top.forEach(function(d) { d.LatLng = new L.LatLng(d.lat,d.lng);});

    z=z.data(data.top,function(d) { return d.index; });

    z.enter().append("circle").classed("markers",true)
      .attr("cx",function(d) { return map.latLngToLayerPoint(d.LatLng).x; })
      .attr("cy",function(d) { return map.latLngToLayerPoint(d.LatLng).y; })
      .attr("r",function(d) { return Math.pow(d.ml,2)*options.size; })
      .style("fill",function(d) { return color(d.z); })
      .style("fill-opacity",function(d) { return options.Opacity/100; })
      .append("title").text(function(d) { return d.dt.toString().slice(0,10)+" Magnitude: "+d.ml+" Depth: "+d.z+"km"; });
    z.exit().remove();

    map.attributionControl.setPrefix(
      d3.format(",")(data.count)+" / "+d3.format(",")(data.size)+" quakes ("+d3.format(",")(data.top.length)+" on map) - (C) 2012 <a href='mailto:ziggy.jonsson.nyc@gmail.com'>zjonsson</a>. Data parsed from <a href='http://www.vedur.is/skjalftar-og-eldgos/jardskjalftar'>Veðurstofa Íslands</a>"
    );

    c.forEach(function(d) { d.refresh();});
    d3.select("#loading").style("visibility","hidden");

var node = svg.selectAll(".circle")
    .data(nodes)
  .enter().append("g")
    .attr("class", "node")
    .call(force.drag);

node.append("circle")
    .attr("r", 4.5);

node.append("text")
    .attr("dx", 12)
    .attr("dy", ".35em")
    .text(function(d) { return d.name });

  });
}

function resize() {
  mapsvg.selectAll("circle")
  .attr("r",function(d) { return Math.pow(d.ml,2)*options.size; })
  .style("fill-opacity",function(d) { return options.Opacity/100; });
}

window.onload = function() {
  var gui = new dat.GUI({ autoPlace: false });
  gui.add(options, 'size', 1, 10).onChange(resize);
  gui.add(options, 'Opacity', 0, 100).onChange(resize);
  gui.add(options,'# mapped',50,5000,50).onFinishChange(refresh);
  var customContainer = document.getElementById('options');
  customContainer.appendChild(gui.domElement);
};

addChart("ml",'Magnitude (Richter)',d3.scale.linear().domain([0,6]));
addChart("z",'Depth (km)',d3.scale.linear().domain([0,30]));
addChart("dt",'Range of dates',d3.time.scale().domain([new Date(1995,1,1),new Date(2012,11,1)]));

refresh();