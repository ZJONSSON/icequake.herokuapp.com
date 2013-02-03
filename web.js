var fs = require('fs'),
    crossfilter = require("./crossfilter.js").crossfilter,
    express = require("express");

var data=fs.readFileSync("earthquakes.txt").toString().replace(/\r/g,"").split("\n")
var logFile = fs.createWriteStream('html/eq.log', {flags: 'a'}); //use {flags: 'w'} to open in write mode

var header = data[0].split(",")

data=data.map(function(d) { 
    var r={};
    d.split(",").forEach(function(d,i) {
        r[header[i]]=d
    })
    return r
})

data=data.filter(function(d) { return d.d && d.d.length >2 && d.ml>0})

data.forEach(function(d, i) {
    d.index = i;
    d.dt = (d.d && d.d.length > 7) ?  new Date(d.d.slice(0,4),d.d.slice(4,6)-1,d.d.slice(6,8)) : new Date(1980,1,1) ;
    d.lat = +d.lat
    d.lng = +d.lng
    d.t = +d.t.slice(0,2)+d.t.slice(2,4)/60+d.t.slice(4,6)/(60*60)
    d.m = +d.m
    d.ml = Math.max(+d.ml,0)
    d.z = +d.z
  });

var f = crossfilter(false);
f.dims = {}
f.grps = {}

var all = f.groupAll();
f.dims.dt = f.dimension(function(d) { return d.dt}),
f.grps.dt = f.dims.dt.group(function(d) { return  new Date(d.getFullYear(),d.getMonth(),1) })

//f.dims.t = f.dimension(function(d) { return  d.t })
//f.grps.t = f.dims.t.group(function(d) { return Math.floor(d)})
f.dims.lat = f.dimension(function(d) { return d.lat }),
f.dims.lng = f.dimension(function(d) { return d.lng})

//f.dims.m = f.dimension(function(d) { return d.m; }),
//f.grps.m = f.dims.m.group(function(d) { return Math.floor(d*10)/10})
 
f.dims.ml = f.dimension(function(d) { return d.ml})
f.grps.ml = f.dims.ml.group(function(d) { return Math.floor(d*10)/10})
f.dims.z = f.dimension(function(d) { return +d.z})
f.grps.z = f.dims.z.group(function(d) { return Math.floor(d)})



f.results = function() {
  var results = {}
  Object.keys(f.grps).forEach(function(key) {
    results[key] = f.grps[key].all().map(function(d) { return {x:d.key,y:d.value}})
  })
  
  return results;
}

      console.log("loaded")
f.add(data)
var size = f.size();

var app=express();
app.use(express.compress())
app.use(express.bodyParser())


app.post("/",function(req,res,next){
  req.method = "GET";
  next()
})

app.use("/",express.static("html/", {maxAge: 0}))

app.use("/eq",function(req,res,next) {
  var filters = JSON.parse(req.param("filter"))
  Object.keys(f.dims).forEach(function(dim) {
    
    if (filters[dim]) {
      if (filters["dt"]) filters.dt=[new Date(filters.dt[0]),new Date(filters.dt[1])]
      f.dims[dim].filterRange(filters[dim])
    } else {
      f.dims[dim].filterAll()
    }
  })
  var results = f.results();
  results.top = f.dims.ml.top(req.param("num"));
  results.count = all.value();
  results.size = size;
  res.setHeader('content-type', 'application/json');
  results = JSON.stringify(results)

  res.end(results+"\n")
})

var port = process.env.PORT || 5000;
app.listen(port,function() {
  console.log("listening to port "+port)  
})