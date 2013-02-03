var n3 = {};

(function() {
  function rebind(target, source, fields) {
    (fields || Object.keys(source)).forEach(function(d) {
      target[d] = function() {
        var result = source[d].apply(target, arguments);
        return result === source ? target : result;
      };
    });
    target.on = function() {
      source.on.apply(source, arguments);
      return target;
    };
    return target;
  }
  n3.rebind = rebind;
  n3.set = function() {
    var set = {}, scales = {};
    set.rebind = function(target) {
      return rebind(set, target);
    };
    function scale(ax, d, properties) {
      if (arguments.length == 0) return Object.keys(scales);
      if (arguments.length == 1) return scales[ax] || (scales[ax] = d3.scale.linear());
      scales[ax] = d || scales[ax];
      if (properties) Object.keys(properties).forEach(function(d) {
        scales[ax][d] = properties[d];
      });
      return set;
    }
    set.scale = scale;
    [ "range", "domain" ].forEach(function(fn) {
      set[fn] = function(ax, d) {
        var s = scale(ax);
        if (arguments.length == 1) return s[fn]();
        s[fn](d3.functor(d)(s[fn]()) || s[fn]());
        return set;
      };
    });
    function project(ax, id) {
      id = id || ax;
      return function(d) {
        var s = scale(ax);
        return s(d[id] != undefined ? d[id] : d[ax] != undefined ? d[ax] : d);
      };
    }
    set.project = project;
    function interval(ax, id) {
      return function(d) {
        return Math.abs(project(ax, id)(d) - project(ax)(0));
      };
    }
    set.interval = interval;
    set.axis = n3.axis;
    set.render = n3.render;
    return set;
  };
  n3.axis = function(ax) {
    var _axis = d3.svg.axis(), tickScale;
    function axis(g) {
      var set = n3.frame(g);
      _axis.scale(set.scale(ax));
      if (tickScale) {
        var range = set.scale(tickScale).range();
        _axis.tickSize(Math.abs(range[1] - range[0]) * (_axis.orient() == "bottom" || _axis.orient() == "left" ? -1 : 1));
      }
      return _axis(g);
    }
    rebind(axis, _axis);
    axis.scale = function(d) {
      if (arguments.length == 0) return ax;
      ax = d;
      return axis;
    };
    axis.tickScale = function(d) {
      if (arguments.length == 0) return tickScale;
      tickScale = d;
      return axis;
    };
    return axis;
  };
  function n3_frame(g) {
    var margin = {
      top: 40,
      bottom: 60,
      left: 40,
      right: 40
    }, dispatch = d3.dispatch("resize", "render"), selector = "*";
    var frame = n3.set(), scale = frame.scale;
    rebind(frame, dispatch, [ "resize", "render" ]);
    frame.g = g = d3.select(g);
    frame.all = function() {
      return g.selectAll(selector);
    };
    frame.margin = function(d) {
      if (arguments.length == 0) return margin;
      [ "left", "top", "right", "bottom" ].forEach(function(e, i) {
        if (typeof d == "number") {
          margin[e] = d;
        } else if (d[e] != null) {
          margin[e] = d[e];
        } else if (d[i] != null) {
          margin[e] = d[i];
        }
      });
      frame.resize();
      return frame;
    };
    frame.on("resize.frame", function() {
      var h = g.attr("height") || g.property("offsetHeight") || 2e3, w = g.attr("width") || g.property("offsetWidth"), ch = [ margin.top, h - margin.top - margin.bottom ], cw = [ margin.left, w - (margin.right + margin.left) ];
      frame.scale("w").range([ 0, w ]);
      frame.scale("h").range([ 0, h ]);
      frame.scale("cw").range(cw);
      frame.scale("bw").range(cw);
      frame.scale("pw").range(cw).domain(cw);
      frame.scale("ch").range(ch);
      frame.scale("bh").range(ch);
      frame.scale("ph").range(ch).domain(ch);
      return frame;
    });
    frame.on("resize.autorange", function() {
      var cw = scale("cw").range(), ch = scale("ch").range();
      frame.scale().forEach(function(d) {
        var scale = frame.scale(d), range = scale.rangeBands ? function(d) {
          return scale.rangeBands(d, scale.padding || .1);
        } : function(d) {
          return scale.range(d);
        };
        if (d[0] == "x") range(cw);
        if (d[0] == "y") range([ ch[1], ch[0] ]);
      });
    });
    frame.on("render.frame", function(duration, delay) {
      frame.resize();
      var g = frame.all();
      if (duration || delay) g = g.transition().duration(duration).delay(delay);
      g.call(n3.render);
    });
    frame.add = function(d, e) {
      return g.selectAll(".__newdata__").data(d, e).enter();
    };
    scale("x");
    scale("y");
    scale("y2");
    frame.resize();
    return frame;
  }
  n3.frame = function(g) {
    if (g.select) g = g[0][0];
    if (g.tagName != "svg" && g.nearestViewportElement) g = g.nearestViewportElement;
    return g.frame || (g.frame = n3_frame(g));
  };
  n3.render = function(elements) {
    if (!elements.each) return;
    elements.each(function() {
      if (!this.nearestViewportElement) return;
      var chart = this.nearestViewportElement.frame;
      var self = d3.select(this);
      var d = self.datum();
      var g = d3.transition(self);
      if (!d) return;
      if (d.attr) self.attr(d.attr);
      if (d.style) self.attr(d.style);
      if (typeof d.render == "function") d.render.call(self.datum(), g);
      if (self.attr("data-scale") == "ignore") return;
      var x = self.attr("data-scale-x") || "x", y = self.attr("data-scale-y") || "y";
      if (self.attr("data-scale") == "chart") {
        x = "cw";
        y = "ch";
      }
      if (self.attr("data-scale") == "box") {
        x = "bw";
        y = "bh";
      }
      if (this.tagName == "g" || this.tagName == "text") {
        var dx = d.x != undefined ? chart.project(x, "x")(d) : 0, dy = d.y != undefined ? chart.project(y, "y")(d) : 0;
        if (dx || dy) g.attr("transform", "translate(" + dx + "," + dy + ")rotate(" + (d.rotate || 0) + ")");
      } else if (this.tagName == "path") {
        if (d[0] && d[0].y1 != undefined) {
          g.attr("d", d3.svg.area().x(chart.project(x, "x")).y(chart.project(y, "y1")).y0(chart.project(y, "y0")));
        } else {
          g.attr("d", d3.svg.line().x(chart.project(x, "x")).y(chart.project(y, "y")).interpolate(self.attr("data-interpolate") || "linear"));
        }
      } else if (this.tagName == "circle") {
        if (d.x != undefined) g.attr("cx", chart.project(x, "x"));
        if (d.y != undefined) g.attr("cy", chart.project(y, "y"));
      } else if (this.tagName == "rect" || this.tagName == "svg") {
        if (d.x == undefined && d.x0 == undefined) return;
        if (chart.scale(x).rangeBands) {
          g.attr("x", chart.scale(x)(d.x != undefined ? d.x : d.x0));
          g.attr("width", chart.scale(x).rangeBand);
        } else {
          var x0 = d.x0 || d.x || 0, x1 = d.x1 != undefined ? d.x1 : x0 + (d.width || d.x), width = d.width != undefined ? d.width : Math.abs(x1 - x0);
          g.attr("x", chart.scale(x)(x0));
          g.attr("width", chart.interval(x)(width));
        }
        if (chart.scale(y).rangeBands) {
          g.attr("y", chart.scale(y)(d.y != undefined ? d.y : d.y0));
          g.attr("height", chart.scale(y).rangeBand);
        } else {
          var y0 = d.y0 || 0, y1 = d.y1 != undefined ? d.y1 : y0 + (d.height || d.y), height = d.height != undefined ? d.height : Math.abs(y1 - y0);
          g.attr("y", chart.scale(y)(y1));
          g.attr("height", chart.interval(y)(height));
        }
      } else {
        if (d.x != undefined) g.attr("x", chart.project(x, "x"));
        if (d.y != undefined) g.attr("y", chart.project(y, "y"));
      }
    });
  };
  n3.fitScale = function(ax, fn) {
    return function(g) {
      if (g.empty()) return;
      var set = n3.frame(g), domain, calcDomain;
      if (set.scale(ax).rangeBand) {
        domain = [];
        calcDomain = function(_ax, d) {
          if (domain.indexOf(d[_ax]) == -1) domain.push(d[_ax]);
        };
      } else {
        domain = [ +Infinity, -Infinity ];
        var minMax = function(d) {
          if (isNaN(d)) return;
          domain[0] = Math.min(domain[0], d);
          domain[1] = Math.max(domain[1], d);
        };
        calcDomain = function(_ax, d) {
          if (!d) return;
          if (!d.length) d = [ d ];
          d.forEach(function(d) {
            minMax(d[_ax]);
            minMax(d[_ax + "0"]);
            minMax(d[_ax + "1"]);
            minMax(d[_ax + "2"]);
          });
        };
      }
      g.each(function(d) {
        var self = d3.select(this), dsx = self.attr("data-scale-x"), dsy = self.attr("data-scale-y");
        if (dsx == ax || !dsx && ax == "x") calcDomain("x", d);
        if (dsy == ax || !dsy && ax == "y") calcDomain("y", d);
      });
      if (fn) domain = d3.functor(fn)(domain);
      if (domain[0] != Infinity && domain[1] != -Infinity) set.scale(ax).domain(domain);
      return set;
    };
  };
  var title_def = {
    chart: {
      x: .5,
      y: 0,
      attr: {
        dy: "-1em",
        "data-scale-x": "cw",
        "data-scale-y": "ch"
      },
      style: {
        "text-anchor": "middle"
      }
    },
    x: {
      x: .5,
      y: 1,
      attr: {
        dy: "0.7em",
        "data-scale-x": "cw",
        "data-scale-y": "bh"
      },
      style: {
        "text-anchor": "middle"
      }
    },
    y: {
      x: 0,
      y: .5,
      rotate: -90,
      attr: {
        dy: "-0.5em",
        "data-scale-x": "bw",
        "data-scale-y": "ch"
      },
      style: {
        "text-anchor": "middle"
      }
    },
    y2: {
      x: 1,
      y: .5,
      attr: {
        dy: "-0.5em",
        "data-scale-x": "bw",
        "data-scale-y": "ch"
      },
      rotate: 90,
      style: {
        "text-anchor": "middle"
      }
    },
    y_top: {
      x: 0,
      y: 0,
      attr: {
        dy: "-0.7em",
        "data-scale-x": "cw",
        "data-scale-y": "ch"
      },
      style: {
        "text-anchor": "end"
      }
    },
    y_inside: {
      x: 0,
      y: 0,
      attr: {
        dy: "1em",
        dx: "-0.5em",
        "data-scale": "chart"
      },
      rotate: -90,
      style: {
        "text-anchor": "end"
      }
    },
    y2_inside: {
      x: 1,
      y: 0,
      attr: {
        dy: "-0.5em",
        dx: "-0.5em",
        "data-scale": "chart"
      },
      rotate: -90,
      style: {
        "text-anchor": "end"
      }
    },
    x_inside: {
      x: 1,
      y: 1,
      attr: {
        dy: "-0.5em",
        "data-scale": "chart"
      },
      style: {
        "text-anchor": "end"
      }
    },
    y2_top: {
      x: 1,
      y: 0,
      attr: {
        dy: "-0.7em",
        "data-scale-x": "cw",
        "data-scale-y": "ch"
      },
      style: {
        "text-anchor": "start"
      }
    },
    center: {
      x: .5,
      y: .5,
      attr: {
        "data-scale-x": "cw",
        "data-scale-y": "ch"
      },
      style: {
        "text-anchor": "middle"
      }
    }
  };
  Object.keys(title_def).forEach(function(key) {
    title_def[key].id = key;
  });
  n3.setTitle = function(title, text) {
    return function(g) {
      g.each(function(d, i) {
        d3.select(this).selectAll(".title." + title).data([ title_def[title] ]).call(function(d) {
          d.enter().append("text").attr("class", "title " + title);
        }).text(d3.functor(text)(d, i)).call(n3.render);
      });
    };
  };
  if (!n3.def) n3.def = {};
  n3.def.axis = {
    x: function() {
      return {
        scale: "x",
        tickScale: "ch",
        y: 1,
        orient: "bottom",
        attr: {
          "data-scale-x": "cw",
          "data-scale-y": "ch"
        }
      };
    },
    y: function() {
      return {
        scale: "y",
        tickScale: "cw",
        x: 0,
        orient: "left",
        attr: {
          "data-scale-x": "cw",
          "data-scale-y": "ch"
        }
      };
    },
    y2: function() {
      return {
        scale: "y2",
        x: 1,
        orient: "right",
        attr: {
          "data-scale-x": "cw",
          "data-scale-y": "ch"
        }
      };
    }
  };
  n3.showAxes = function(axes) {
    axes = [].concat(axes).map(function(d) {
      var ax = n3.def.axis[d]();
      ax.render = n3.axis(d).orient(ax.orient).tickScale(ax.tickScale);
      return ax;
    }).filter(function(d) {
      return d;
    });
    return function(g) {
      g.each(function() {
        d3.select(this).selectAll(".axis").data(axes).call(function(d) {
          d.exit().remove();
        }).enter().append("g").attr("class", function(d) {
          return "axis " + d.scale;
        });
      });
    };
  };
  n3.legend = function(target) {
    var legendPadding = 5, orient = "dr";
    var legend = function(g) {
      if (!g || !g.each) return;
      var items = {}, lc = target.selectAll(".legend-container").data([ true ]).call(function(d) {
        d.enter().append("g").classed("legend-container", true);
      }), lb = lc.selectAll(".legend-box").data([ true ]), li = lc.selectAll(".legend-items").data([ true ]);
      lb.enter().append("rect").classed("legend-box", true);
      li.enter().append("g").classed("legend-items", true);
      g.each(function() {
        var self = d3.select(this);
        if (!self.attr("data-legend")) return;
        items[self.attr("data-legend")] = {
          pos: self.attr("data-legend-pos"),
          by: this.getBBox().y,
          bh: this.getBBox().height,
          color: self.attr("data-legend-color") != undefined ? self.attr("data-legend-color") : self.style("fill") != "none" ? self.style("fill") : self.style("stroke")
        };
      });
      items = d3.entries(items).sort(function(a, b) {
        return a.value.pos - b.value.pos || a.value.by - b.value.by || a.value.bh - b.value.bh;
      });
      li.selectAll("text").data(items, function(d) {
        return d.key;
      }).call(function(d) {
        d.enter().append("text");
      }).call(function(d) {
        d.exit().remove();
      }).attr("y", function(d, i) {
        return i + "em";
      }).attr("x", "1em").text(function(d) {
        return d.key;
      });
      li.selectAll("circle").data(items, function(d) {
        return d.key;
      }).call(function(d) {
        d.enter().append("circle");
      }).call(function(d) {
        d.exit().remove();
      }).attr("cy", function(d, i) {
        return i - .25 + "em";
      }).attr("cx", 0).attr("r", "0.4em").style("fill", function(d) {
        return d.value.color;
      });
      var lbbox = li[0][0].getBBox();
      var x = lbbox.x - legendPadding, y = lbbox.y - legendPadding, h = lbbox.height + 2 * legendPadding, w = lbbox.width + 2 * legendPadding;
      lb.attr("x", x).attr("y", y).attr("height", h).attr("width", w);
      y = orient[0] && orient[0] == "u" ? -h - y : -y;
      x = orient[1] && orient[1] == "l" ? -w - x : -x;
      lc.attr("transform", "translate(" + x + "," + y + ")");
    };
    legend.padding = function(d) {
      if (arguments.length == 0) return d;
      legendPadding = d;
      return legend;
    };
    legend.orient = function(d) {
      if (arguments.length == 0) return d;
      orient = d;
      return legend;
    };
    return legend;
  };
  n3.bbox = function(g) {
    var x = [ Infinity, -Infinity ], y = [ Infinity, -Infinity ];
    g.each(function() {
      var d = this.bbox;
      if (!d) return;
      x[0] = Min(x[0], d.x);
      x[1] = Max(x[1], d.x + d.width);
      y[0] = Min(y[0], d.y);
      y[1] = Max(y[1], d.y + d.width);
    });
    return {
      x: x,
      y: y
    };
  };
  n3.subplot = function(g, rows, cols, num) {
    var subplots = g.g.selectAll(".subplot").data(d3.range(rows * cols));
    subplots.enter().append("svg").call(n3.chart()).attr("class", function(d, i) {
      return "subplot subplot" + i;
    });
    subplots.exit().remove();
    return sublots[0][num].frame;
  };
  n3.lineEdit = function() {
    var drag = d3.behavior.drag();
    n3.rebind(lineEdit, drag, []);
    function lineEdit(g) {
      var chart = n3.chart(g), line = g.append("path"), circles = g.append("g"), radius = 10, selected;
      drag.origin(function(d) {
        var res = {
          x: chart.project("x")(d),
          y: chart.project("y")(d)
        };
        return res;
      }).on("drag.lineEdit", dragmove);
      function dragmove(d, i) {
        console.log(d, i);
        d.x = chart.scale("x").invert(d3.event.x);
        d.x = Math.max(d.x, g.datum()[i - 1] ? g.datum()[i - 1].x : chart.domain("x")[0]);
        d.x = Math.min(d.x, g.datum()[i + 1] ? g.datum()[i + 1].x : chart.domain("x")[1]);
        d.y = chart.scale("y").invert(d3.event.y);
        line.call(n3.render);
        d3.select(this).call(n3.render);
      }
      function refresh() {
        circles.selectAll("circle").data(Object).call(function(e) {
          e.exit().remove();
        }).call(function(e) {
          e.enter().append("circle").attr("r", radius).call(drag).on("mousedown.selected", function(d) {
            selected = d;
            refresh();
          });
        }).classed("selected", function(d) {
          return d === selected;
        });
      }
      refresh();
    }
    lineEdit.radius = function(d) {
      if (arguments.length == 0) return radius;
      radius = d;
      circles.selectAll("circle").attr("r", radius);
      return lineEdit;
    };
    lineEdit.datum = function() {
      return datum;
    };
    return lineEdit;
  };
  n3.pathbox = function(line, padding) {
    var path = [], box = [];
    if (padding == undefined) padding = 2;
    line.forEach(function(d, i) {
      var start, end;
      start = line[i - 1] ? {
        x: (d.x + line[i - 1].x) / 2,
        y: (d.y + line[i - 1].y) / 2
      } : {
        x: d.x,
        y: d.y
      };
      end = line[i + 1] ? {
        x: (line[i + 1].x + d.x) / 2,
        y: (line[i + 1].y + d.y) / 2
      } : {
        x: d.x,
        y: d.y
      };
      path.push([ start, start, end, end, start ]);
      start = line[i - 1] ? start.x + padding : d.x - (line[i + 1].x - d.x) / 2 + padding;
      end = line[i + 1] ? end.x - padding : d.x + (d.x - line[i - 1].x) / 2 - padding;
      box.push([ {
        x: start,
        y: d.y
      }, {
        x: start,
        y: 0
      }, {
        x: end,
        y: 0
      }, {
        x: end,
        y: d.y
      }, {
        x: start,
        y: d.y
      } ]);
    });
    return {
      line: path,
      box: box
    };
  };
  var uniqueID = 0;
  var default_y_fit = function(d) {
    return [ d[0] * .9, d[1] * 1.1 ];
  };
  n3.chart = function(g) {
    if (!g.select) g = d3.select(g);
    var chart = n3.frame(g);
    if (chart.graph) return chart;
    [ "back", "cliparea", "graph", "overlay" ].forEach(function(d) {
      chart[d] = g.append("g").classed(d, true);
    });
    chart.showAxes = function() {
      chart.back.call(n3.showAxes.apply(chart, arguments));
      return chart;
    };
    chart.setTitle = function() {
      chart.overlay.call(n3.setTitle.apply(chart, arguments));
      return chart;
    };
    chart.fitScale = function(ax, fn) {
      chart.all().call(n3.fitScale(ax, fn));
      return chart;
    };
    var legend = chart.overlay.append("g").classed("legend", true).datum({
      x: .05,
      y: .05
    }).attr("data-scale", "chart");
    uniqueID++;
    chart.cliparea.append("clipPath").attr("id", "graphClip" + uniqueID).append("rect").classed("graphClip", true).attr("data-scale-x", "cw").attr("data-scale-y", "ch").datum({
      x0: 0,
      x1: 1,
      y0: 1,
      y1: 0
    });
    chart.graph.attr("clip-path", "url(#graphClip" + uniqueID + ")");
    chart.enter = function(d, f) {
      var newdata = chart.graph.selectAll(".__newdata__").data(d).enter();
      if (arguments.length == 1) return newdata;
      d3.functor(f)(newdata);
      return chart;
    };
    chart.axis = function(ax, d) {
      var ax = chart.back.select(".axis." + ax).datum();
      if (arguments.length == 1) return ax.render;
      ax.render = d3.functor(d)(ax.render) || ax.render;
      return chart;
    };
    chart.tickFormat = function(ax, d) {
      chart.axis(ax).tickFormat(d);
      return chart;
    };
    chart.on("resize.autofit", function() {
      var nodes = chart.graph.selectAll(":not(.exiting)");
      nodes.call(n3.fitScale("x"));
      nodes.call(n3.fitScale("y", default_y_fit));
      nodes.call(n3.fitScale("y2", default_y_fit));
    });
    chart.on("resize.cliparea", function() {
      chart.cliparea.selectAll("rect").call(n3.render);
    });
    chart.legend = n3.legend(legend);
    chart.on("render.autolegend", function() {
      var g = chart.graph.selectAll("[data-legend]");
      if (g.empty()) return legend.selectAll("*").remove();
      g.call(chart.legend);
      legend.call(n3.render);
    });
    chart.on("render.autobbox", function(duration, delay) {
      var bbox = chart.back[0][0].getBBox();
      chart.scale("bw").range([ bbox.x, bbox.x + bbox.width ]);
      chart.scale("bh").range([ bbox.y, bbox.y + bbox.height ]);
      chart.overlay.selectAll("*").transition().duration(duration).delay(delay).call(n3.render);
    });
    chart.add = chart.enter;
    chart.showAxes([ "x", "y" ]);
    return chart;
  };
  if (typeof module !== "undefined") module.exports = n3;
})();