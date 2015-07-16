'use strict';
/* global require: false, module: false, less: false */

require('./classList');
var State = require('ampersand-state');
var Collection = require('ampersand-collection');
var View = require('ampersand-view');


var VariableState = State.extend({
  props: {
    name: {
      type: 'string',
      required: true
    },
    value: 'string',
    filename: 'string'
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
              '<span></span>' +
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
    'model.filename': [
      {
        type: 'toggle',
        selector: 'span'
      },
      {
        type: 'text',
        selector: 'span'
      }
    ],
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

              '<div class="errors"><div></div></div>' +

              '<div class="actions">' +
                '<a target="_blank" class="download">Download</a>'+
              '</div>' +
            '</div>',

  session: {
    open: 'boolean',
    dragingOver: 'boolean',
    compiling: 'number',
    compiled: 'string',
    globals: 'any',
    error: 'any',
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
    dragingOver: {
      type: 'booleanClass',
      name: 'drag-over'
    },

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

    error: [
      {
        type: 'booleanClass'
      },
      {
        type: 'text',
        selector: '.errors > div'
      }
    ],

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
    'change .input':      '_handleInputChange',

    'drag':               '_fileDrag',
    'dragstart':          '_fileDrag',
    'dragover':           '_fileDrag',
    'dragend':            '_handleDragend',
    'drop':               '_handleDrop'
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



  _fileDrag: function (evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy';
    this.dragingOver = true;
  },

  _handleDragend: function () {
    this.dragingOver = false;
  },

  _handleDrop: function (evt) {
    evt.stopPropagation();
    evt.preventDefault();
    this.dragingOver = false;
    var self = this;

    function readFileData(file) {
      return function (progressEvt) {
        var varName = 'custom-' + file.type.split('/').shift() + '-' + self.variables.length;
        self.variables.add({
          filename: file.name,
          name: varName,
          value: '"'+ progressEvt.target.result +'"'
        });
      };
    }

    var reader;
    var files = evt.dataTransfer.files;
    for (var i = 0; i < files.length; i++) {
      reader = new FileReader();
      reader.onload = readFileData(files[i]);
      reader.readAsDataURL(files[i]);
    }
  },

  remove: function () {
    document.body.removeChild(this.styleEl);
    View.prototype.remove.apply(this, arguments);
  },

  update: function () {
    var self = this;

    var src = self.inputEl.value;

    function success(output) {
      self.compiling = null;
      self.compiled = output.css;

      if (self.applyToPage) {
        self.styleEl.innerHTML = output.css;
      }
    }

    function error(err) {
      self.compiling = null;
      self.error = err.message;
      // throw err;
    }

    // debounce and prevent blocking
    if (self.compiling) {
      clearTimeout(self.compiling);
    }

    self.compiling = setTimeout(function () {
      self.error = null;
      less.render(src, {
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
