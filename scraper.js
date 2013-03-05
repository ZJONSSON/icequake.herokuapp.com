/*jshint node:true*/
"use strict";
var fs = require("fs"),
  http = require("http");

http.globalAgent.maxSockets = 25;  // A bit rude.  Tone down to be polite

var regEx = /(-?\d+\.?\d?)\s*(-?\d+\.?\d+)\s*(-?\d+\.?\d+)\s*(-?\d+\.?\d+)\s*(-?\d+\.?\d+)\s*(-?\d+\.?\d+)\s*(-?\d+\.?\d+)\s*(-?\d+\.?\d+)\s*(-?\d+\.?\d+)\n/g;

var file = fs.createWriteStream("equ.txt",{flags:'w',encoding:'utf-8'}),
    today = new Date(),
    thisYear = today.getFullYear(),
    thisWeek = (today - new Date(thisYear,0,1)) / (1000*60*60*24*7)+2,
    paths = [];

file.write("no,d,t,lat,lng,z,m,ml\n");

// Generate a list of URLs
for (var year = 1995;year<=thisYear;year++) {
  for (var week = 1; week<=52; week++) {
    if (!(year == thisYear && week > thisWeek)) {
      var vika = week.toString();
      if (vika.length == 1) vika ="0"+vika;
      paths.push("/ja/viku/"+year+"/vika_"+vika+"/listi");
    }
  }
}

paths.forEach(function(path) {
  var options = {
    host:"hraun.vedur.is",
    path:path,
    headers:{"User-Agent": "Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.22 (KHTML, like Gecko) Chrome/25.0.1364.97 Safari/537.22"}
  };

  function process(res) {
    var body = "";  
    res.on('data',function(chunk) {
      body+=chunk.toString();
    });
    res.on("end",function() {
      var match;
      while (match = regEx.exec(body))  {
        file.write(match.slice(1).join(",")+"\n");
      }
      console.log("Done: "+options.path);
    });
  }

  http.request(options,process)
    .on("error",console.log)
    .end();
});


