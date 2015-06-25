(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.StylesEditor = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
/* global deps: false, require: false, module: false, less: false */

var State = deps('ampersand-state');
var Collection = deps('ampersand-collection');
var View = deps('ampersand-view');

// var State = require('ampersand-state');
// var Collection = require('ampersand-collection');
// var View = require('ampersand-view');

/*
var ImportState = State.extend({
  props: {
    name: {
      type: 'string',
      required: true
    },
    directive: 'string'
  }
});

var ImportsCollection = Collection.extend({
  mainIndex: 'name',
  model: ImportState,
  toLess: function () {
    var lines = this.map(function (imp) {
      var directive = '';
      if (imp.directive && imp.directive.trim()) {
        directive = '(' + imp.directive.trim() + ') ';
      }
      return '@import ' +
              directive +
              '"' + imp.name + '";';
    });

    return lines.join('\n');
  }
});
*/

var VariableState = State.extend({
  props: {
    name: {
      type: 'string',
      required: true
    },
    value: 'string'
  },

  session: {
    original: {
      type: 'string'
    }
  },

  derived: {
    changed: {
      deps: ['original', 'value'],
      fn: function () {
        return this.original !== this.value;
      }
    }
  }
});

var VariablesCollection = Collection.extend({
  mainIndex: 'name',
  model: VariableState,
  toObj: function () {
    var obj = {};

    this.forEach(function (variable) {
      obj[variable.name] = variable.value;
    });

    return obj;
  }
});


var VariableView = View.extend({
  template: '<li>' +
              '<label></label>' +
              '<div>' +
                '<input type="text" />' +
                '<a title="reset">×</a>' +
              '</div>' +
            '</li>',

  bindings: {
    'model.name': {
      type: 'text',
      selector: 'label'
    },
    'model.value': {
      type: 'value',
      selector: 'input'
    },
    'model.changed': {
      type: 'booleanClass',
      name: 'changed'
    },
    'parent.compiling': {
      selector: 'input',
      type: 'booleanAttribute',
      name: 'disabled'
    },
    cid: [
      {
        type: 'attribute',
        name: 'for',
        selector: 'label'
      },
      {
        type: 'attribute',
        name: 'id',
        selector: 'input'
      }
    ]
  },

  events: {
    'focus input':  '_handleInputFocus',
    'change input': '_handleInputChange',
    'click a':      '_handleResetClick'
  },

  _handleInputFocus: function (evt) {
    evt.target.scrollIntoViewIfNeeded();
  },

  _handleInputChange: function (evt) {
    if (this.model.value === evt.target.value) { return; }
    this.model.value = evt.target.value;
  },

  _handleResetClick: function () {
    this.model.value = this.model.original;
  }
});







var Editor = View.extend({
  autoRender: true,

  template: '<div class="styles-editor">' +
              '<div class="toggle-open">' +
                '<a><span></span><span></span><span></span></a>' +
              '</div>' +

              '<div class="tabs-wrapper">' +
                '<ul class="tabs">' +
                  '<li class="variables">Variables</li>' +
                  // '<li class="imports">Imports</li>' +
                  '<li class="base">Base</li>' +
                '</ul>' +

                '<div class="tabs-content">' +
                  '<ul class="variables"></ul>' +
                  // '<ul class="imports"></ul>' +
                  '<div class="base">' +
                    '<textarea class="input"></textarea>' +
                  '</div>' +
                '</div>' +
              '</div>' +

              // '<textarea class="output" readonly></textarea>' +

              '<div class="actions">' +
                '<a target="_blank" class="download">Download</a>'+
              '</div>' +
            '</div>',

  session: {
    open: 'boolean',
    compiling: 'number',
    compiled: 'string',
    globals: 'any',
    // rootpath: {
    //   type: 'any',
    //   test: function (val) {
    //     if (typeof val !== 'string' && val !== false) {
    //       return 'Seriously?';
    //     }
    //   },
    //   default: 'less-src'
    // },
    applyToPage: {
      type: 'boolean',
      default: true
    },
    showTab: {
      type: 'string',
      default: 'variables'
    }
  },

  collections: {
    // imports:    ImportsCollection,
    variables:  VariablesCollection
  },

  bindings: {
    open: [
      {
        type: 'booleanClass',
        name: 'open'
      },
      {
        type: function (el, value) {
          document.body.classList[value ? 'add' : 'remove']('styles-editor-open');
        }
      }
    ],

    compiling: {
      type: 'booleanClass',
      name: 'compiling'
    },

    compiled: [
      {
        type: 'value',
        selector: '.output'
      },
      {
        selector: '.download',
        type: function (el, value) {
          if (!value) {
            el.removeAttribute('href');
            return;
          }
          var blob = new Blob([value], {type: 'text/css'});
          el.setAttribute('href', URL.createObjectURL(blob));
        }
      }
    ],

    showTab: [
      {
        type: function (el, value) {
          this.queryAll('.tabs > li').forEach(function (li) {
            li.classList.remove('active');
          });
          this.query('.tabs > li.' + value).classList.add('active');
        },
        selector: '.tabs'
      },
      {
        type: function (el, value) {
          this.queryAll('.tabs-content > *').forEach(function (ul) {
            ul.classList.remove('active');
          });
          this.query('.tabs-content > .' + value).classList.add('active');
        },
        selector: '.tabs-content'
      }
    ]
  },

  events: {
    'click .toggle-open': '_handleOpenClick',
    'click .tabs li':     '_handleTabClick',
    // 'click .output':      '_handleOutputClick',
    // 'focus .output':      '_handleOutputClick',
    'change .input':      '_handleInputChange'
  },

  _handleOpenClick: function () {
    this.open = !this.open;
  },

  _handleTabClick: function (evt) {
    this.showTab = evt.target.className;
  },

  _handleInputChange: function () {
    this.update();
  },

  // _handleOutputClick: function () {
  //   this.outputEl.select();
  // },

  remove: function () {
    document.body.removeChild(this.styleEl);
    View.prototype.remove.apply(this, arguments);
  },

  update: function () {
    var self = this;

    var src = self.inputEl.value;
    // var src = self.imports.toLess();

    function success(output) {
      self.compiling = null;
      self.compiled = output.css;

      if (self.applyToPage) {
        self.styleEl.innerHTML = output.css;
      }
    }

    function error(err) {
      self.compiling = null;
      throw err;
    }

    // debounce and prevent blocking
    if (self.compiling) {
      clearTimeout(self.compiling);
    }

    self.compiling = setTimeout(function () {
      less.render(src, {
        // rootpath:   self.rootpath,
        globalVars: self.globals,
        modifyVars: self.variables.toObj()
      }).then(success, error);
    }, 10);


    return this;
  },

  render: function () {
    this.renderWithTemplate();

    this.cacheElements({
      tabsEl:       'ul.tabs',
      variablesEl:  'ul.variables',
      importsEl:    'ul.imports',
      inputEl:      'textarea.input',
      outputEl:     'textarea.output',
      downloadEl:   'a.download'
    });

    if (!this.inputEl) {
      throw new Error('Missing input textarea element');
    }

    this.styleEl = document.createElement('style');
    document.body.appendChild(this.styleEl);

    this.variablesView = this.renderCollection(this.variables, VariableView, this.variablesEl);
    this.listenToAndRun(this.variables, 'all', this.update);

    return this.update();
  }
});

Editor.objToStates = function (obj) {
  var arr = [];
  Object.keys(obj).forEach(function (key) {
    arr.push({
      name:     key,
      value:    obj[key],
      original: obj[key]
    });
  });
  return arr;
};

module.exports = Editor;

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzY3JpcHRzL3N0eWxlcy1lZGl0b3IuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuLyogZ2xvYmFsIGRlcHM6IGZhbHNlLCByZXF1aXJlOiBmYWxzZSwgbW9kdWxlOiBmYWxzZSwgbGVzczogZmFsc2UgKi9cblxudmFyIFN0YXRlID0gZGVwcygnYW1wZXJzYW5kLXN0YXRlJyk7XG52YXIgQ29sbGVjdGlvbiA9IGRlcHMoJ2FtcGVyc2FuZC1jb2xsZWN0aW9uJyk7XG52YXIgVmlldyA9IGRlcHMoJ2FtcGVyc2FuZC12aWV3Jyk7XG5cbi8vIHZhciBTdGF0ZSA9IHJlcXVpcmUoJ2FtcGVyc2FuZC1zdGF0ZScpO1xuLy8gdmFyIENvbGxlY3Rpb24gPSByZXF1aXJlKCdhbXBlcnNhbmQtY29sbGVjdGlvbicpO1xuLy8gdmFyIFZpZXcgPSByZXF1aXJlKCdhbXBlcnNhbmQtdmlldycpO1xuXG4vKlxudmFyIEltcG9ydFN0YXRlID0gU3RhdGUuZXh0ZW5kKHtcbiAgcHJvcHM6IHtcbiAgICBuYW1lOiB7XG4gICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgIHJlcXVpcmVkOiB0cnVlXG4gICAgfSxcbiAgICBkaXJlY3RpdmU6ICdzdHJpbmcnXG4gIH1cbn0pO1xuXG52YXIgSW1wb3J0c0NvbGxlY3Rpb24gPSBDb2xsZWN0aW9uLmV4dGVuZCh7XG4gIG1haW5JbmRleDogJ25hbWUnLFxuICBtb2RlbDogSW1wb3J0U3RhdGUsXG4gIHRvTGVzczogZnVuY3Rpb24gKCkge1xuICAgIHZhciBsaW5lcyA9IHRoaXMubWFwKGZ1bmN0aW9uIChpbXApIHtcbiAgICAgIHZhciBkaXJlY3RpdmUgPSAnJztcbiAgICAgIGlmIChpbXAuZGlyZWN0aXZlICYmIGltcC5kaXJlY3RpdmUudHJpbSgpKSB7XG4gICAgICAgIGRpcmVjdGl2ZSA9ICcoJyArIGltcC5kaXJlY3RpdmUudHJpbSgpICsgJykgJztcbiAgICAgIH1cbiAgICAgIHJldHVybiAnQGltcG9ydCAnICtcbiAgICAgICAgICAgICAgZGlyZWN0aXZlICtcbiAgICAgICAgICAgICAgJ1wiJyArIGltcC5uYW1lICsgJ1wiOyc7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gbGluZXMuam9pbignXFxuJyk7XG4gIH1cbn0pO1xuKi9cblxudmFyIFZhcmlhYmxlU3RhdGUgPSBTdGF0ZS5leHRlbmQoe1xuICBwcm9wczoge1xuICAgIG5hbWU6IHtcbiAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgcmVxdWlyZWQ6IHRydWVcbiAgICB9LFxuICAgIHZhbHVlOiAnc3RyaW5nJ1xuICB9LFxuXG4gIHNlc3Npb246IHtcbiAgICBvcmlnaW5hbDoge1xuICAgICAgdHlwZTogJ3N0cmluZydcbiAgICB9XG4gIH0sXG5cbiAgZGVyaXZlZDoge1xuICAgIGNoYW5nZWQ6IHtcbiAgICAgIGRlcHM6IFsnb3JpZ2luYWwnLCAndmFsdWUnXSxcbiAgICAgIGZuOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm9yaWdpbmFsICE9PSB0aGlzLnZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxufSk7XG5cbnZhciBWYXJpYWJsZXNDb2xsZWN0aW9uID0gQ29sbGVjdGlvbi5leHRlbmQoe1xuICBtYWluSW5kZXg6ICduYW1lJyxcbiAgbW9kZWw6IFZhcmlhYmxlU3RhdGUsXG4gIHRvT2JqOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIG9iaiA9IHt9O1xuXG4gICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uICh2YXJpYWJsZSkge1xuICAgICAgb2JqW3ZhcmlhYmxlLm5hbWVdID0gdmFyaWFibGUudmFsdWU7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gb2JqO1xuICB9XG59KTtcblxuXG52YXIgVmFyaWFibGVWaWV3ID0gVmlldy5leHRlbmQoe1xuICB0ZW1wbGF0ZTogJzxsaT4nICtcbiAgICAgICAgICAgICAgJzxsYWJlbD48L2xhYmVsPicgK1xuICAgICAgICAgICAgICAnPGRpdj4nICtcbiAgICAgICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgLz4nICtcbiAgICAgICAgICAgICAgICAnPGEgdGl0bGU9XCJyZXNldFwiPsOXPC9hPicgK1xuICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAnPC9saT4nLFxuXG4gIGJpbmRpbmdzOiB7XG4gICAgJ21vZGVsLm5hbWUnOiB7XG4gICAgICB0eXBlOiAndGV4dCcsXG4gICAgICBzZWxlY3RvcjogJ2xhYmVsJ1xuICAgIH0sXG4gICAgJ21vZGVsLnZhbHVlJzoge1xuICAgICAgdHlwZTogJ3ZhbHVlJyxcbiAgICAgIHNlbGVjdG9yOiAnaW5wdXQnXG4gICAgfSxcbiAgICAnbW9kZWwuY2hhbmdlZCc6IHtcbiAgICAgIHR5cGU6ICdib29sZWFuQ2xhc3MnLFxuICAgICAgbmFtZTogJ2NoYW5nZWQnXG4gICAgfSxcbiAgICAncGFyZW50LmNvbXBpbGluZyc6IHtcbiAgICAgIHNlbGVjdG9yOiAnaW5wdXQnLFxuICAgICAgdHlwZTogJ2Jvb2xlYW5BdHRyaWJ1dGUnLFxuICAgICAgbmFtZTogJ2Rpc2FibGVkJ1xuICAgIH0sXG4gICAgY2lkOiBbXG4gICAgICB7XG4gICAgICAgIHR5cGU6ICdhdHRyaWJ1dGUnLFxuICAgICAgICBuYW1lOiAnZm9yJyxcbiAgICAgICAgc2VsZWN0b3I6ICdsYWJlbCdcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHR5cGU6ICdhdHRyaWJ1dGUnLFxuICAgICAgICBuYW1lOiAnaWQnLFxuICAgICAgICBzZWxlY3RvcjogJ2lucHV0J1xuICAgICAgfVxuICAgIF1cbiAgfSxcblxuICBldmVudHM6IHtcbiAgICAnZm9jdXMgaW5wdXQnOiAgJ19oYW5kbGVJbnB1dEZvY3VzJyxcbiAgICAnY2hhbmdlIGlucHV0JzogJ19oYW5kbGVJbnB1dENoYW5nZScsXG4gICAgJ2NsaWNrIGEnOiAgICAgICdfaGFuZGxlUmVzZXRDbGljaydcbiAgfSxcblxuICBfaGFuZGxlSW5wdXRGb2N1czogZnVuY3Rpb24gKGV2dCkge1xuICAgIGV2dC50YXJnZXQuc2Nyb2xsSW50b1ZpZXdJZk5lZWRlZCgpO1xuICB9LFxuXG4gIF9oYW5kbGVJbnB1dENoYW5nZTogZnVuY3Rpb24gKGV2dCkge1xuICAgIGlmICh0aGlzLm1vZGVsLnZhbHVlID09PSBldnQudGFyZ2V0LnZhbHVlKSB7IHJldHVybjsgfVxuICAgIHRoaXMubW9kZWwudmFsdWUgPSBldnQudGFyZ2V0LnZhbHVlO1xuICB9LFxuXG4gIF9oYW5kbGVSZXNldENsaWNrOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5tb2RlbC52YWx1ZSA9IHRoaXMubW9kZWwub3JpZ2luYWw7XG4gIH1cbn0pO1xuXG5cblxuXG5cblxuXG52YXIgRWRpdG9yID0gVmlldy5leHRlbmQoe1xuICBhdXRvUmVuZGVyOiB0cnVlLFxuXG4gIHRlbXBsYXRlOiAnPGRpdiBjbGFzcz1cInN0eWxlcy1lZGl0b3JcIj4nICtcbiAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJ0b2dnbGUtb3BlblwiPicgK1xuICAgICAgICAgICAgICAgICc8YT48c3Bhbj48L3NwYW4+PHNwYW4+PC9zcGFuPjxzcGFuPjwvc3Bhbj48L2E+JyArXG4gICAgICAgICAgICAgICc8L2Rpdj4nICtcblxuICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cInRhYnMtd3JhcHBlclwiPicgK1xuICAgICAgICAgICAgICAgICc8dWwgY2xhc3M9XCJ0YWJzXCI+JyArXG4gICAgICAgICAgICAgICAgICAnPGxpIGNsYXNzPVwidmFyaWFibGVzXCI+VmFyaWFibGVzPC9saT4nICtcbiAgICAgICAgICAgICAgICAgIC8vICc8bGkgY2xhc3M9XCJpbXBvcnRzXCI+SW1wb3J0czwvbGk+JyArXG4gICAgICAgICAgICAgICAgICAnPGxpIGNsYXNzPVwiYmFzZVwiPkJhc2U8L2xpPicgK1xuICAgICAgICAgICAgICAgICc8L3VsPicgK1xuXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJ0YWJzLWNvbnRlbnRcIj4nICtcbiAgICAgICAgICAgICAgICAgICc8dWwgY2xhc3M9XCJ2YXJpYWJsZXNcIj48L3VsPicgK1xuICAgICAgICAgICAgICAgICAgLy8gJzx1bCBjbGFzcz1cImltcG9ydHNcIj48L3VsPicgK1xuICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJiYXNlXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8dGV4dGFyZWEgY2xhc3M9XCJpbnB1dFwiPjwvdGV4dGFyZWE+JyArXG4gICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAnPC9kaXY+JyArXG5cbiAgICAgICAgICAgICAgLy8gJzx0ZXh0YXJlYSBjbGFzcz1cIm91dHB1dFwiIHJlYWRvbmx5PjwvdGV4dGFyZWE+JyArXG5cbiAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJhY3Rpb25zXCI+JyArXG4gICAgICAgICAgICAgICAgJzxhIHRhcmdldD1cIl9ibGFua1wiIGNsYXNzPVwiZG93bmxvYWRcIj5Eb3dubG9hZDwvYT4nK1xuICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAnPC9kaXY+JyxcblxuICBzZXNzaW9uOiB7XG4gICAgb3BlbjogJ2Jvb2xlYW4nLFxuICAgIGNvbXBpbGluZzogJ251bWJlcicsXG4gICAgY29tcGlsZWQ6ICdzdHJpbmcnLFxuICAgIGdsb2JhbHM6ICdhbnknLFxuICAgIC8vIHJvb3RwYXRoOiB7XG4gICAgLy8gICB0eXBlOiAnYW55JyxcbiAgICAvLyAgIHRlc3Q6IGZ1bmN0aW9uICh2YWwpIHtcbiAgICAvLyAgICAgaWYgKHR5cGVvZiB2YWwgIT09ICdzdHJpbmcnICYmIHZhbCAhPT0gZmFsc2UpIHtcbiAgICAvLyAgICAgICByZXR1cm4gJ1NlcmlvdXNseT8nO1xuICAgIC8vICAgICB9XG4gICAgLy8gICB9LFxuICAgIC8vICAgZGVmYXVsdDogJ2xlc3Mtc3JjJ1xuICAgIC8vIH0sXG4gICAgYXBwbHlUb1BhZ2U6IHtcbiAgICAgIHR5cGU6ICdib29sZWFuJyxcbiAgICAgIGRlZmF1bHQ6IHRydWVcbiAgICB9LFxuICAgIHNob3dUYWI6IHtcbiAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgZGVmYXVsdDogJ3ZhcmlhYmxlcydcbiAgICB9XG4gIH0sXG5cbiAgY29sbGVjdGlvbnM6IHtcbiAgICAvLyBpbXBvcnRzOiAgICBJbXBvcnRzQ29sbGVjdGlvbixcbiAgICB2YXJpYWJsZXM6ICBWYXJpYWJsZXNDb2xsZWN0aW9uXG4gIH0sXG5cbiAgYmluZGluZ3M6IHtcbiAgICBvcGVuOiBbXG4gICAgICB7XG4gICAgICAgIHR5cGU6ICdib29sZWFuQ2xhc3MnLFxuICAgICAgICBuYW1lOiAnb3BlbidcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHR5cGU6IGZ1bmN0aW9uIChlbCwgdmFsdWUpIHtcbiAgICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdFt2YWx1ZSA/ICdhZGQnIDogJ3JlbW92ZSddKCdzdHlsZXMtZWRpdG9yLW9wZW4nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIF0sXG5cbiAgICBjb21waWxpbmc6IHtcbiAgICAgIHR5cGU6ICdib29sZWFuQ2xhc3MnLFxuICAgICAgbmFtZTogJ2NvbXBpbGluZydcbiAgICB9LFxuXG4gICAgY29tcGlsZWQ6IFtcbiAgICAgIHtcbiAgICAgICAgdHlwZTogJ3ZhbHVlJyxcbiAgICAgICAgc2VsZWN0b3I6ICcub3V0cHV0J1xuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgc2VsZWN0b3I6ICcuZG93bmxvYWQnLFxuICAgICAgICB0eXBlOiBmdW5jdGlvbiAoZWwsIHZhbHVlKSB7XG4gICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgZWwucmVtb3ZlQXR0cmlidXRlKCdocmVmJyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBibG9iID0gbmV3IEJsb2IoW3ZhbHVlXSwge3R5cGU6ICd0ZXh0L2Nzcyd9KTtcbiAgICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIF0sXG5cbiAgICBzaG93VGFiOiBbXG4gICAgICB7XG4gICAgICAgIHR5cGU6IGZ1bmN0aW9uIChlbCwgdmFsdWUpIHtcbiAgICAgICAgICB0aGlzLnF1ZXJ5QWxsKCcudGFicyA+IGxpJykuZm9yRWFjaChmdW5jdGlvbiAobGkpIHtcbiAgICAgICAgICAgIGxpLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHRoaXMucXVlcnkoJy50YWJzID4gbGkuJyArIHZhbHVlKS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICAgICAgfSxcbiAgICAgICAgc2VsZWN0b3I6ICcudGFicydcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIHR5cGU6IGZ1bmN0aW9uIChlbCwgdmFsdWUpIHtcbiAgICAgICAgICB0aGlzLnF1ZXJ5QWxsKCcudGFicy1jb250ZW50ID4gKicpLmZvckVhY2goZnVuY3Rpb24gKHVsKSB7XG4gICAgICAgICAgICB1bC5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICB0aGlzLnF1ZXJ5KCcudGFicy1jb250ZW50ID4gLicgKyB2YWx1ZSkuY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gICAgICAgIH0sXG4gICAgICAgIHNlbGVjdG9yOiAnLnRhYnMtY29udGVudCdcbiAgICAgIH1cbiAgICBdXG4gIH0sXG5cbiAgZXZlbnRzOiB7XG4gICAgJ2NsaWNrIC50b2dnbGUtb3Blbic6ICdfaGFuZGxlT3BlbkNsaWNrJyxcbiAgICAnY2xpY2sgLnRhYnMgbGknOiAgICAgJ19oYW5kbGVUYWJDbGljaycsXG4gICAgLy8gJ2NsaWNrIC5vdXRwdXQnOiAgICAgICdfaGFuZGxlT3V0cHV0Q2xpY2snLFxuICAgIC8vICdmb2N1cyAub3V0cHV0JzogICAgICAnX2hhbmRsZU91dHB1dENsaWNrJyxcbiAgICAnY2hhbmdlIC5pbnB1dCc6ICAgICAgJ19oYW5kbGVJbnB1dENoYW5nZSdcbiAgfSxcblxuICBfaGFuZGxlT3BlbkNsaWNrOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5vcGVuID0gIXRoaXMub3BlbjtcbiAgfSxcblxuICBfaGFuZGxlVGFiQ2xpY2s6IGZ1bmN0aW9uIChldnQpIHtcbiAgICB0aGlzLnNob3dUYWIgPSBldnQudGFyZ2V0LmNsYXNzTmFtZTtcbiAgfSxcblxuICBfaGFuZGxlSW5wdXRDaGFuZ2U6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnVwZGF0ZSgpO1xuICB9LFxuXG4gIC8vIF9oYW5kbGVPdXRwdXRDbGljazogZnVuY3Rpb24gKCkge1xuICAvLyAgIHRoaXMub3V0cHV0RWwuc2VsZWN0KCk7XG4gIC8vIH0sXG5cbiAgcmVtb3ZlOiBmdW5jdGlvbiAoKSB7XG4gICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZCh0aGlzLnN0eWxlRWwpO1xuICAgIFZpZXcucHJvdG90eXBlLnJlbW92ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9LFxuXG4gIHVwZGF0ZTogZnVuY3Rpb24gKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHZhciBzcmMgPSBzZWxmLmlucHV0RWwudmFsdWU7XG4gICAgLy8gdmFyIHNyYyA9IHNlbGYuaW1wb3J0cy50b0xlc3MoKTtcblxuICAgIGZ1bmN0aW9uIHN1Y2Nlc3Mob3V0cHV0KSB7XG4gICAgICBzZWxmLmNvbXBpbGluZyA9IG51bGw7XG4gICAgICBzZWxmLmNvbXBpbGVkID0gb3V0cHV0LmNzcztcblxuICAgICAgaWYgKHNlbGYuYXBwbHlUb1BhZ2UpIHtcbiAgICAgICAgc2VsZi5zdHlsZUVsLmlubmVySFRNTCA9IG91dHB1dC5jc3M7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZXJyb3IoZXJyKSB7XG4gICAgICBzZWxmLmNvbXBpbGluZyA9IG51bGw7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfVxuXG4gICAgLy8gZGVib3VuY2UgYW5kIHByZXZlbnQgYmxvY2tpbmdcbiAgICBpZiAoc2VsZi5jb21waWxpbmcpIHtcbiAgICAgIGNsZWFyVGltZW91dChzZWxmLmNvbXBpbGluZyk7XG4gICAgfVxuXG4gICAgc2VsZi5jb21waWxpbmcgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgIGxlc3MucmVuZGVyKHNyYywge1xuICAgICAgICAvLyByb290cGF0aDogICBzZWxmLnJvb3RwYXRoLFxuICAgICAgICBnbG9iYWxWYXJzOiBzZWxmLmdsb2JhbHMsXG4gICAgICAgIG1vZGlmeVZhcnM6IHNlbGYudmFyaWFibGVzLnRvT2JqKClcbiAgICAgIH0pLnRoZW4oc3VjY2VzcywgZXJyb3IpO1xuICAgIH0sIDEwKTtcblxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5yZW5kZXJXaXRoVGVtcGxhdGUoKTtcblxuICAgIHRoaXMuY2FjaGVFbGVtZW50cyh7XG4gICAgICB0YWJzRWw6ICAgICAgICd1bC50YWJzJyxcbiAgICAgIHZhcmlhYmxlc0VsOiAgJ3VsLnZhcmlhYmxlcycsXG4gICAgICBpbXBvcnRzRWw6ICAgICd1bC5pbXBvcnRzJyxcbiAgICAgIGlucHV0RWw6ICAgICAgJ3RleHRhcmVhLmlucHV0JyxcbiAgICAgIG91dHB1dEVsOiAgICAgJ3RleHRhcmVhLm91dHB1dCcsXG4gICAgICBkb3dubG9hZEVsOiAgICdhLmRvd25sb2FkJ1xuICAgIH0pO1xuXG4gICAgaWYgKCF0aGlzLmlucHV0RWwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTWlzc2luZyBpbnB1dCB0ZXh0YXJlYSBlbGVtZW50Jyk7XG4gICAgfVxuXG4gICAgdGhpcy5zdHlsZUVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRoaXMuc3R5bGVFbCk7XG5cbiAgICB0aGlzLnZhcmlhYmxlc1ZpZXcgPSB0aGlzLnJlbmRlckNvbGxlY3Rpb24odGhpcy52YXJpYWJsZXMsIFZhcmlhYmxlVmlldywgdGhpcy52YXJpYWJsZXNFbCk7XG4gICAgdGhpcy5saXN0ZW5Ub0FuZFJ1bih0aGlzLnZhcmlhYmxlcywgJ2FsbCcsIHRoaXMudXBkYXRlKTtcblxuICAgIHJldHVybiB0aGlzLnVwZGF0ZSgpO1xuICB9XG59KTtcblxuRWRpdG9yLm9ialRvU3RhdGVzID0gZnVuY3Rpb24gKG9iaikge1xuICB2YXIgYXJyID0gW107XG4gIE9iamVjdC5rZXlzKG9iaikuZm9yRWFjaChmdW5jdGlvbiAoa2V5KSB7XG4gICAgYXJyLnB1c2goe1xuICAgICAgbmFtZTogICAgIGtleSxcbiAgICAgIHZhbHVlOiAgICBvYmpba2V5XSxcbiAgICAgIG9yaWdpbmFsOiBvYmpba2V5XVxuICAgIH0pO1xuICB9KTtcbiAgcmV0dXJuIGFycjtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gRWRpdG9yO1xuIl19
