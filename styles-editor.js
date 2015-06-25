(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.StylesEditor = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
/* global deps: false, module: false, less: false */

deps('./../classList');
var State = deps('ampersand-state');
var Collection = deps('ampersand-collection');
var View = deps('ampersand-view');

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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzY3JpcHRzL3N0eWxlcy1lZGl0b3IuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuLyogZ2xvYmFsIGRlcHM6IGZhbHNlLCBtb2R1bGU6IGZhbHNlLCBsZXNzOiBmYWxzZSAqL1xuXG5kZXBzKCcuLy4uL2NsYXNzTGlzdCcpO1xudmFyIFN0YXRlID0gZGVwcygnYW1wZXJzYW5kLXN0YXRlJyk7XG52YXIgQ29sbGVjdGlvbiA9IGRlcHMoJ2FtcGVyc2FuZC1jb2xsZWN0aW9uJyk7XG52YXIgVmlldyA9IGRlcHMoJ2FtcGVyc2FuZC12aWV3Jyk7XG5cbi8qXG52YXIgSW1wb3J0U3RhdGUgPSBTdGF0ZS5leHRlbmQoe1xuICBwcm9wczoge1xuICAgIG5hbWU6IHtcbiAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgcmVxdWlyZWQ6IHRydWVcbiAgICB9LFxuICAgIGRpcmVjdGl2ZTogJ3N0cmluZydcbiAgfVxufSk7XG5cbnZhciBJbXBvcnRzQ29sbGVjdGlvbiA9IENvbGxlY3Rpb24uZXh0ZW5kKHtcbiAgbWFpbkluZGV4OiAnbmFtZScsXG4gIG1vZGVsOiBJbXBvcnRTdGF0ZSxcbiAgdG9MZXNzOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGxpbmVzID0gdGhpcy5tYXAoZnVuY3Rpb24gKGltcCkge1xuICAgICAgdmFyIGRpcmVjdGl2ZSA9ICcnO1xuICAgICAgaWYgKGltcC5kaXJlY3RpdmUgJiYgaW1wLmRpcmVjdGl2ZS50cmltKCkpIHtcbiAgICAgICAgZGlyZWN0aXZlID0gJygnICsgaW1wLmRpcmVjdGl2ZS50cmltKCkgKyAnKSAnO1xuICAgICAgfVxuICAgICAgcmV0dXJuICdAaW1wb3J0ICcgK1xuICAgICAgICAgICAgICBkaXJlY3RpdmUgK1xuICAgICAgICAgICAgICAnXCInICsgaW1wLm5hbWUgKyAnXCI7JztcbiAgICB9KTtcblxuICAgIHJldHVybiBsaW5lcy5qb2luKCdcXG4nKTtcbiAgfVxufSk7XG4qL1xuXG52YXIgVmFyaWFibGVTdGF0ZSA9IFN0YXRlLmV4dGVuZCh7XG4gIHByb3BzOiB7XG4gICAgbmFtZToge1xuICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICByZXF1aXJlZDogdHJ1ZVxuICAgIH0sXG4gICAgdmFsdWU6ICdzdHJpbmcnXG4gIH0sXG5cbiAgc2Vzc2lvbjoge1xuICAgIG9yaWdpbmFsOiB7XG4gICAgICB0eXBlOiAnc3RyaW5nJ1xuICAgIH1cbiAgfSxcblxuICBkZXJpdmVkOiB7XG4gICAgY2hhbmdlZDoge1xuICAgICAgZGVwczogWydvcmlnaW5hbCcsICd2YWx1ZSddLFxuICAgICAgZm46IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMub3JpZ2luYWwgIT09IHRoaXMudmFsdWU7XG4gICAgICB9XG4gICAgfVxuICB9XG59KTtcblxudmFyIFZhcmlhYmxlc0NvbGxlY3Rpb24gPSBDb2xsZWN0aW9uLmV4dGVuZCh7XG4gIG1haW5JbmRleDogJ25hbWUnLFxuICBtb2RlbDogVmFyaWFibGVTdGF0ZSxcbiAgdG9PYmo6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgb2JqID0ge307XG5cbiAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24gKHZhcmlhYmxlKSB7XG4gICAgICBvYmpbdmFyaWFibGUubmFtZV0gPSB2YXJpYWJsZS52YWx1ZTtcbiAgICB9KTtcblxuICAgIHJldHVybiBvYmo7XG4gIH1cbn0pO1xuXG5cbnZhciBWYXJpYWJsZVZpZXcgPSBWaWV3LmV4dGVuZCh7XG4gIHRlbXBsYXRlOiAnPGxpPicgK1xuICAgICAgICAgICAgICAnPGxhYmVsPjwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICc8ZGl2PicgK1xuICAgICAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInRleHRcIiAvPicgK1xuICAgICAgICAgICAgICAgICc8YSB0aXRsZT1cInJlc2V0XCI+w5c8L2E+JyArXG4gICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICc8L2xpPicsXG5cbiAgYmluZGluZ3M6IHtcbiAgICAnbW9kZWwubmFtZSc6IHtcbiAgICAgIHR5cGU6ICd0ZXh0JyxcbiAgICAgIHNlbGVjdG9yOiAnbGFiZWwnXG4gICAgfSxcbiAgICAnbW9kZWwudmFsdWUnOiB7XG4gICAgICB0eXBlOiAndmFsdWUnLFxuICAgICAgc2VsZWN0b3I6ICdpbnB1dCdcbiAgICB9LFxuICAgICdtb2RlbC5jaGFuZ2VkJzoge1xuICAgICAgdHlwZTogJ2Jvb2xlYW5DbGFzcycsXG4gICAgICBuYW1lOiAnY2hhbmdlZCdcbiAgICB9LFxuICAgICdwYXJlbnQuY29tcGlsaW5nJzoge1xuICAgICAgc2VsZWN0b3I6ICdpbnB1dCcsXG4gICAgICB0eXBlOiAnYm9vbGVhbkF0dHJpYnV0ZScsXG4gICAgICBuYW1lOiAnZGlzYWJsZWQnXG4gICAgfSxcbiAgICBjaWQ6IFtcbiAgICAgIHtcbiAgICAgICAgdHlwZTogJ2F0dHJpYnV0ZScsXG4gICAgICAgIG5hbWU6ICdmb3InLFxuICAgICAgICBzZWxlY3RvcjogJ2xhYmVsJ1xuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgdHlwZTogJ2F0dHJpYnV0ZScsXG4gICAgICAgIG5hbWU6ICdpZCcsXG4gICAgICAgIHNlbGVjdG9yOiAnaW5wdXQnXG4gICAgICB9XG4gICAgXVxuICB9LFxuXG4gIGV2ZW50czoge1xuICAgICdmb2N1cyBpbnB1dCc6ICAnX2hhbmRsZUlucHV0Rm9jdXMnLFxuICAgICdjaGFuZ2UgaW5wdXQnOiAnX2hhbmRsZUlucHV0Q2hhbmdlJyxcbiAgICAnY2xpY2sgYSc6ICAgICAgJ19oYW5kbGVSZXNldENsaWNrJ1xuICB9LFxuXG4gIF9oYW5kbGVJbnB1dEZvY3VzOiBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgZXZ0LnRhcmdldC5zY3JvbGxJbnRvVmlld0lmTmVlZGVkKCk7XG4gIH0sXG5cbiAgX2hhbmRsZUlucHV0Q2hhbmdlOiBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgaWYgKHRoaXMubW9kZWwudmFsdWUgPT09IGV2dC50YXJnZXQudmFsdWUpIHsgcmV0dXJuOyB9XG4gICAgdGhpcy5tb2RlbC52YWx1ZSA9IGV2dC50YXJnZXQudmFsdWU7XG4gIH0sXG5cbiAgX2hhbmRsZVJlc2V0Q2xpY2s6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLm1vZGVsLnZhbHVlID0gdGhpcy5tb2RlbC5vcmlnaW5hbDtcbiAgfVxufSk7XG5cblxuXG5cblxuXG5cbnZhciBFZGl0b3IgPSBWaWV3LmV4dGVuZCh7XG4gIGF1dG9SZW5kZXI6IHRydWUsXG5cbiAgdGVtcGxhdGU6ICc8ZGl2IGNsYXNzPVwic3R5bGVzLWVkaXRvclwiPicgK1xuICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cInRvZ2dsZS1vcGVuXCI+JyArXG4gICAgICAgICAgICAgICAgJzxhPjxzcGFuPjwvc3Bhbj48c3Bhbj48L3NwYW4+PHNwYW4+PC9zcGFuPjwvYT4nICtcbiAgICAgICAgICAgICAgJzwvZGl2PicgK1xuXG4gICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwidGFicy13cmFwcGVyXCI+JyArXG4gICAgICAgICAgICAgICAgJzx1bCBjbGFzcz1cInRhYnNcIj4nICtcbiAgICAgICAgICAgICAgICAgICc8bGkgY2xhc3M9XCJ2YXJpYWJsZXNcIj5WYXJpYWJsZXM8L2xpPicgK1xuICAgICAgICAgICAgICAgICAgLy8gJzxsaSBjbGFzcz1cImltcG9ydHNcIj5JbXBvcnRzPC9saT4nICtcbiAgICAgICAgICAgICAgICAgICc8bGkgY2xhc3M9XCJiYXNlXCI+QmFzZTwvbGk+JyArXG4gICAgICAgICAgICAgICAgJzwvdWw+JyArXG5cbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cInRhYnMtY29udGVudFwiPicgK1xuICAgICAgICAgICAgICAgICAgJzx1bCBjbGFzcz1cInZhcmlhYmxlc1wiPjwvdWw+JyArXG4gICAgICAgICAgICAgICAgICAvLyAnPHVsIGNsYXNzPVwiaW1wb3J0c1wiPjwvdWw+JyArXG4gICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImJhc2VcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzx0ZXh0YXJlYSBjbGFzcz1cImlucHV0XCI+PC90ZXh0YXJlYT4nICtcbiAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICc8L2Rpdj4nICtcblxuICAgICAgICAgICAgICAvLyAnPHRleHRhcmVhIGNsYXNzPVwib3V0cHV0XCIgcmVhZG9ubHk+PC90ZXh0YXJlYT4nICtcblxuICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImFjdGlvbnNcIj4nICtcbiAgICAgICAgICAgICAgICAnPGEgdGFyZ2V0PVwiX2JsYW5rXCIgY2xhc3M9XCJkb3dubG9hZFwiPkRvd25sb2FkPC9hPicrXG4gICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICc8L2Rpdj4nLFxuXG4gIHNlc3Npb246IHtcbiAgICBvcGVuOiAnYm9vbGVhbicsXG4gICAgY29tcGlsaW5nOiAnbnVtYmVyJyxcbiAgICBjb21waWxlZDogJ3N0cmluZycsXG4gICAgZ2xvYmFsczogJ2FueScsXG4gICAgLy8gcm9vdHBhdGg6IHtcbiAgICAvLyAgIHR5cGU6ICdhbnknLFxuICAgIC8vICAgdGVzdDogZnVuY3Rpb24gKHZhbCkge1xuICAgIC8vICAgICBpZiAodHlwZW9mIHZhbCAhPT0gJ3N0cmluZycgJiYgdmFsICE9PSBmYWxzZSkge1xuICAgIC8vICAgICAgIHJldHVybiAnU2VyaW91c2x5Pyc7XG4gICAgLy8gICAgIH1cbiAgICAvLyAgIH0sXG4gICAgLy8gICBkZWZhdWx0OiAnbGVzcy1zcmMnXG4gICAgLy8gfSxcbiAgICBhcHBseVRvUGFnZToge1xuICAgICAgdHlwZTogJ2Jvb2xlYW4nLFxuICAgICAgZGVmYXVsdDogdHJ1ZVxuICAgIH0sXG4gICAgc2hvd1RhYjoge1xuICAgICAgdHlwZTogJ3N0cmluZycsXG4gICAgICBkZWZhdWx0OiAndmFyaWFibGVzJ1xuICAgIH1cbiAgfSxcblxuICBjb2xsZWN0aW9uczoge1xuICAgIC8vIGltcG9ydHM6ICAgIEltcG9ydHNDb2xsZWN0aW9uLFxuICAgIHZhcmlhYmxlczogIFZhcmlhYmxlc0NvbGxlY3Rpb25cbiAgfSxcblxuICBiaW5kaW5nczoge1xuICAgIG9wZW46IFtcbiAgICAgIHtcbiAgICAgICAgdHlwZTogJ2Jvb2xlYW5DbGFzcycsXG4gICAgICAgIG5hbWU6ICdvcGVuJ1xuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgdHlwZTogZnVuY3Rpb24gKGVsLCB2YWx1ZSkge1xuICAgICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0W3ZhbHVlID8gJ2FkZCcgOiAncmVtb3ZlJ10oJ3N0eWxlcy1lZGl0b3Itb3BlbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgXSxcblxuICAgIGNvbXBpbGluZzoge1xuICAgICAgdHlwZTogJ2Jvb2xlYW5DbGFzcycsXG4gICAgICBuYW1lOiAnY29tcGlsaW5nJ1xuICAgIH0sXG5cbiAgICBjb21waWxlZDogW1xuICAgICAge1xuICAgICAgICB0eXBlOiAndmFsdWUnLFxuICAgICAgICBzZWxlY3RvcjogJy5vdXRwdXQnXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBzZWxlY3RvcjogJy5kb3dubG9hZCcsXG4gICAgICAgIHR5cGU6IGZ1bmN0aW9uIChlbCwgdmFsdWUpIHtcbiAgICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICBlbC5yZW1vdmVBdHRyaWJ1dGUoJ2hyZWYnKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIGJsb2IgPSBuZXcgQmxvYihbdmFsdWVdLCB7dHlwZTogJ3RleHQvY3NzJ30pO1xuICAgICAgICAgIGVsLnNldEF0dHJpYnV0ZSgnaHJlZicsIFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYikpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgXSxcblxuICAgIHNob3dUYWI6IFtcbiAgICAgIHtcbiAgICAgICAgdHlwZTogZnVuY3Rpb24gKGVsLCB2YWx1ZSkge1xuICAgICAgICAgIHRoaXMucXVlcnlBbGwoJy50YWJzID4gbGknKS5mb3JFYWNoKGZ1bmN0aW9uIChsaSkge1xuICAgICAgICAgICAgbGkuY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgdGhpcy5xdWVyeSgnLnRhYnMgPiBsaS4nICsgdmFsdWUpLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgICAgICB9LFxuICAgICAgICBzZWxlY3RvcjogJy50YWJzJ1xuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgdHlwZTogZnVuY3Rpb24gKGVsLCB2YWx1ZSkge1xuICAgICAgICAgIHRoaXMucXVlcnlBbGwoJy50YWJzLWNvbnRlbnQgPiAqJykuZm9yRWFjaChmdW5jdGlvbiAodWwpIHtcbiAgICAgICAgICAgIHVsLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHRoaXMucXVlcnkoJy50YWJzLWNvbnRlbnQgPiAuJyArIHZhbHVlKS5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcbiAgICAgICAgfSxcbiAgICAgICAgc2VsZWN0b3I6ICcudGFicy1jb250ZW50J1xuICAgICAgfVxuICAgIF1cbiAgfSxcblxuICBldmVudHM6IHtcbiAgICAnY2xpY2sgLnRvZ2dsZS1vcGVuJzogJ19oYW5kbGVPcGVuQ2xpY2snLFxuICAgICdjbGljayAudGFicyBsaSc6ICAgICAnX2hhbmRsZVRhYkNsaWNrJyxcbiAgICAvLyAnY2xpY2sgLm91dHB1dCc6ICAgICAgJ19oYW5kbGVPdXRwdXRDbGljaycsXG4gICAgLy8gJ2ZvY3VzIC5vdXRwdXQnOiAgICAgICdfaGFuZGxlT3V0cHV0Q2xpY2snLFxuICAgICdjaGFuZ2UgLmlucHV0JzogICAgICAnX2hhbmRsZUlucHV0Q2hhbmdlJ1xuICB9LFxuXG4gIF9oYW5kbGVPcGVuQ2xpY2s6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLm9wZW4gPSAhdGhpcy5vcGVuO1xuICB9LFxuXG4gIF9oYW5kbGVUYWJDbGljazogZnVuY3Rpb24gKGV2dCkge1xuICAgIHRoaXMuc2hvd1RhYiA9IGV2dC50YXJnZXQuY2xhc3NOYW1lO1xuICB9LFxuXG4gIF9oYW5kbGVJbnB1dENoYW5nZTogZnVuY3Rpb24gKCkge1xuICAgIHRoaXMudXBkYXRlKCk7XG4gIH0sXG5cbiAgLy8gX2hhbmRsZU91dHB1dENsaWNrOiBmdW5jdGlvbiAoKSB7XG4gIC8vICAgdGhpcy5vdXRwdXRFbC5zZWxlY3QoKTtcbiAgLy8gfSxcblxuICByZW1vdmU6IGZ1bmN0aW9uICgpIHtcbiAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKHRoaXMuc3R5bGVFbCk7XG4gICAgVmlldy5wcm90b3R5cGUucmVtb3ZlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH0sXG5cbiAgdXBkYXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdmFyIHNyYyA9IHNlbGYuaW5wdXRFbC52YWx1ZTtcbiAgICAvLyB2YXIgc3JjID0gc2VsZi5pbXBvcnRzLnRvTGVzcygpO1xuXG4gICAgZnVuY3Rpb24gc3VjY2VzcyhvdXRwdXQpIHtcbiAgICAgIHNlbGYuY29tcGlsaW5nID0gbnVsbDtcbiAgICAgIHNlbGYuY29tcGlsZWQgPSBvdXRwdXQuY3NzO1xuXG4gICAgICBpZiAoc2VsZi5hcHBseVRvUGFnZSkge1xuICAgICAgICBzZWxmLnN0eWxlRWwuaW5uZXJIVE1MID0gb3V0cHV0LmNzcztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlcnJvcihlcnIpIHtcbiAgICAgIHNlbGYuY29tcGlsaW5nID0gbnVsbDtcbiAgICAgIHRocm93IGVycjtcbiAgICB9XG5cbiAgICAvLyBkZWJvdW5jZSBhbmQgcHJldmVudCBibG9ja2luZ1xuICAgIGlmIChzZWxmLmNvbXBpbGluZykge1xuICAgICAgY2xlYXJUaW1lb3V0KHNlbGYuY29tcGlsaW5nKTtcbiAgICB9XG5cbiAgICBzZWxmLmNvbXBpbGluZyA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgbGVzcy5yZW5kZXIoc3JjLCB7XG4gICAgICAgIC8vIHJvb3RwYXRoOiAgIHNlbGYucm9vdHBhdGgsXG4gICAgICAgIGdsb2JhbFZhcnM6IHNlbGYuZ2xvYmFscyxcbiAgICAgICAgbW9kaWZ5VmFyczogc2VsZi52YXJpYWJsZXMudG9PYmooKVxuICAgICAgfSkudGhlbihzdWNjZXNzLCBlcnJvcik7XG4gICAgfSwgMTApO1xuXG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnJlbmRlcldpdGhUZW1wbGF0ZSgpO1xuXG4gICAgdGhpcy5jYWNoZUVsZW1lbnRzKHtcbiAgICAgIHRhYnNFbDogICAgICAgJ3VsLnRhYnMnLFxuICAgICAgdmFyaWFibGVzRWw6ICAndWwudmFyaWFibGVzJyxcbiAgICAgIGltcG9ydHNFbDogICAgJ3VsLmltcG9ydHMnLFxuICAgICAgaW5wdXRFbDogICAgICAndGV4dGFyZWEuaW5wdXQnLFxuICAgICAgb3V0cHV0RWw6ICAgICAndGV4dGFyZWEub3V0cHV0JyxcbiAgICAgIGRvd25sb2FkRWw6ICAgJ2EuZG93bmxvYWQnXG4gICAgfSk7XG5cbiAgICBpZiAoIXRoaXMuaW5wdXRFbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdNaXNzaW5nIGlucHV0IHRleHRhcmVhIGVsZW1lbnQnKTtcbiAgICB9XG5cbiAgICB0aGlzLnN0eWxlRWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpO1xuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQodGhpcy5zdHlsZUVsKTtcblxuICAgIHRoaXMudmFyaWFibGVzVmlldyA9IHRoaXMucmVuZGVyQ29sbGVjdGlvbih0aGlzLnZhcmlhYmxlcywgVmFyaWFibGVWaWV3LCB0aGlzLnZhcmlhYmxlc0VsKTtcbiAgICB0aGlzLmxpc3RlblRvQW5kUnVuKHRoaXMudmFyaWFibGVzLCAnYWxsJywgdGhpcy51cGRhdGUpO1xuXG4gICAgcmV0dXJuIHRoaXMudXBkYXRlKCk7XG4gIH1cbn0pO1xuXG5FZGl0b3Iub2JqVG9TdGF0ZXMgPSBmdW5jdGlvbiAob2JqKSB7XG4gIHZhciBhcnIgPSBbXTtcbiAgT2JqZWN0LmtleXMob2JqKS5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcbiAgICBhcnIucHVzaCh7XG4gICAgICBuYW1lOiAgICAga2V5LFxuICAgICAgdmFsdWU6ICAgIG9ialtrZXldLFxuICAgICAgb3JpZ2luYWw6IG9ialtrZXldXG4gICAgfSk7XG4gIH0pO1xuICByZXR1cm4gYXJyO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBFZGl0b3I7XG4iXX0=
