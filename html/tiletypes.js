var cloudmadeUrl = 'http://{s}.tile.cloudmade.com/3d487eb6127d4b68adb916f293fa4785/{styleId}/256/{z}/{x}/{y}.png', 
    cloudmadeAttribution = 'Map data &copy; 2012 OpenStreetMap contributors, Imagery &copy; 2012 CloudMade',
    tileTypes = {
      mapboxGray : new L.TileLayer('http://{s}.tiles.mapbox.com/v3/cartodb.map-1nh578vv/{z}/{x}/{y}.png', {attribution: 'Map tiles by <a href="http://mapbox.com/about/maps/">Mapbox</a>'}),
      mapQuest : new L.TileLayer('http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', {attribution: 'Data, imagery and map information provided by <a href="http://open.mapquest.co.uk" target="_blank">MapQuest</a>,<a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> and contributors.', subdomains: ['otile1','otile2','otile3','otile4']}),
      minimal : new L.TileLayer(cloudmadeUrl, {attribution: cloudmadeAttribution, styleId: 22677}),
      midnightCommander : new L.TileLayer(cloudmadeUrl, {attribution: cloudmadeAttribution, styleId: 999}),
      cloudmadeoriginal : new L.TileLayer(cloudmadeUrl, {attribution: cloudmadeAttribution, styleId: 1}),
      osm : new L.TileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'Map data by <a target="_top" href="http://openstreetmap.org">OpenStreetMap</a>, under <a target="_top" href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>'}),
      mapboxTerrain : new L.TileLayer('http://{s}.tiles.mapbox.com/v3/examples.map-4l7djmvo/{z}/{x}/{y}.png', {attribution: 'Map tiles by <a href="http://mapbox.com/about/maps/">Mapbox</a>'}),
      LMI : L.tileLayer.wms("http://gis.lmi.is/arcgis/services/kort_isn93/atlas100r_isn93/MapServer/WMSServer",{layers:0,attribution:'Underlying maps Â© <a href="http://www.lmi.is/wp-content/uploads/2013/01/GeneralTermsNLSI.pdf">National Land Survey of Iceland</a>'}),
      StamenToner : new L.TileLayer('http://{s}.tile.stamen.com/toner/{z}/{x}/{y}.png', {attribution: 'Map tiles</a> by <a target="_top" href="http://stamen.com">Stamen Design</a>, under <a target="_top" href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a target="_top" href="http://openstreetmap.org">OpenStreetMap</a>, under <a target="_top" href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>'}),  
      StamenWatercolor  : new L.TileLayer('http://{s}.tile.stamen.com/watercolor/{z}/{x}/{y}.png', {attribution: 'Map tiles</a> by <a target="_top" href="http://stamen.com">Stamen Design</a>, under <a target="_top" href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a target="_top" href="http://openstreetmap.org">OpenStreetMap</a>, under <a target="_top" href="http://creativecommons.org/licenses/by-sa/3.0">CC BY SA</a>'})
    };
