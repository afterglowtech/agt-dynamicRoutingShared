/*! agt-dynamicRoutingShared - v0.0.1 - 2013-06-11
 * https://github.com/afterglowtech/agt-dynamicRoutingShared
 * Copyright (c) 2013 Stu Salsbury;
 *    Based on https://github.com/angular-ui/ui-router which is 
 *    Copyright (c) 2013, Karsten Sperling
 * Licensed MIT
 */
define(['common', 'UrlMatcher'], function(common, UrlMatcher) {
  var abstractVar = 'abstract'
  ;

  function StateBase() {
    this.children = {};
  }


  //*********************************************
  // initialize
  //*********************************************
  Object.defineProperty(StateBase.prototype, 'self', {
    get: function() { return this; }
  });

  StateBase.prototype.resetAll = function() {
  };

  StateBase.prototype.initialize = function(forceInit) {
    if (this.needsInit || forceInit) {
      this.resetAll();

      for (var child in this.children) {
        this.children[child].initialize(true);
      }
      this.needsInit = false;
    }
  };

  //*********************************************
  // name/fullName/localName
  //*********************************************
  Object.defineProperty(StateBase.prototype, 'fullName', {
    get: function() { return this._fullName; }
  });
  Object.defineProperty(StateBase.prototype, 'name', {
    get: function() { return this._fullName; }
  });
  Object.defineProperty(StateBase.prototype, 'localName', {
    get: function() { return this._localName; },
    set: function(val) {
      this.validateName(val);
      this._localName= val;
      this.needsInit = true;
    }
  });

  StateBase.prototype.resetFullName = function() {
    this._fullName = (this.parent.fullName)
      ? this.parent.fullName + '.' + this.localName
      : this.localName;
  };
  StateBase.prototype.toString = function() { return this.fullName; };

  StateBase.prototype.validateName = function(localName) {
    if (!common.isString(localName) || localName.indexOf('@') >= 0) {
      throw new Error('Invalid local state name (' + localName + ')');
    }

    // can't redefine if we throw this error here
    //not really useful, anyway
    // if (this.parent && this.parent.getChild(localName)) {
    //     throw new Error('State ' + parent.fullName  + ' already has child ' + localName);
    // }
  };

  //*********************************************
  // root
  //*********************************************
  Object.defineProperty(StateBase.prototype, 'root', {
    get: function() { return this.parent.root; }
  });

  //*********************************************
  // children
  //*********************************************
  Object.defineProperty(StateBase.prototype, 'children', {
    get: function() { return this._children; },
    set: function(val) {
      this._children = val;
      if (this._children) {
        for (var child in this._children) {
          //assigning their parent takes care of resetting the children
          this._children[child].parent = this;
        }
      }
    }
  });

  //*********************************************
  // path
  //*********************************************
  StateBase.prototype.resetPath = function() {
    // Keep a full path from the root down to this state as this is needed for state activation.
    this.path = this.parent.path.concat(this); // exclude root from path
  };

  //*********************************************
  // url
  //*********************************************
  Object.defineProperty(StateBase.prototype, 'url', {
    get: function() { return this._url; },
    set: function(val) {
      this._url= val;
      this.needsInit = true;
    }
  });
  Object.defineProperty(StateBase.prototype, 'aliases', {
    get: function() { return this._aliases; },
    set: function(val) {
      this._aliases= val;
      this.needsInit = true;
    }
  });


  StateBase.prototype.resetUrls = function() {
    /*jshint eqeqeq:false */
    this.preparedUrl = null;
    if (common.isString(this.url)) {
      if (this.url.charAt(0) === '^') {
        this.preparedUrl = new UrlMatcher(this.url.substring(1));
      } else {
        this.preparedUrl = (this.parent.navigable || this.root).preparedUrl.concat(this.url);
      }
    } else if (common.isObject(this.url) &&
        common.isFunction(this.url.exec) && common.isFunction(this.url.format) && common.isFunction(this.url.concat)) {
          this.preparedUrl = this.url;
      /* use UrlMatcher (or compatible object) as is */
    } else if (this.url != null) {
      throw new Error('Invalid url ' + this.url + ' in state ' + this);
    }

    if (this.aliases) {
      this.preparedAliases = [];
      for (var alias in this.aliases) {
        if (alias.charAt(0) === '^') {
          this.preparedAliases.push(new UrlMatcher(alias.substring(1)));
        }
        else {
          this.preparedAliases.push((this.parent.navigable || this.root).preparedUrl.concat(alias));
        }
      }
    }
    else {
      this.preparedAliases = null;
    }



  };

  //*********************************************
  // params
  //*********************************************
  Object.defineProperty(StateBase.prototype, 'params', {
    get: function() { return this._params; },
    set: function(val) {
      this._params= val;
      this.needsInit = true;
    }
  });
  StateBase.prototype.resetParams = function() {};

  //*********************************************
  // navigable
  //*********************************************
  StateBase.prototype.resetNavigable = function() {
    this.navigable = (this.url)
      ? this
      : (this.parent)
        ? this.parent.navigable
        : null;
  };

  //*********************************************
  // abstract
  //*********************************************
  Object.defineProperty(StateBase.prototype, abstractVar, {
    get: function() { return this._abstract; },
    set: function(val) {
      this._abstract= val;
      this.needsInit = true;
    }
  });

  //*********************************************
  // includes
  //*********************************************
  StateBase.prototype.resetIncludes = function() {
    // Speed up $detour.contains() as it's used a lot
    this.includes = (this.parent)
      ? common.extend({}, this.parent.includes)
      : {};
    this.includes[this.name] = true;
  };

  //*********************************************
  // views
  //*********************************************
  Object.defineProperty(StateBase.prototype, 'views', {
    get: function() { return this._views; },
    set: function(val) {
      this._views= val;
      this.needsInit = true;
    }
  });
  StateBase.prototype.resetViews = function() {
    var state = this;
    // If there is no explicit multi-view configuration, make one up so we don't have
    // to handle both cases in the view directive later. Note that having an explicit
    // 'views' property will mean the default unnamed view properties are ignored. This
    // is also a good time to resolve view names to absolute names, so everything is a
    // straight lookup at link time.
    var views = {};
    var myViews = this.views;
    common.forEach(common.isDefined(myViews) ? myViews : { '': state }, function (view, name) {
      if (name.indexOf('@') < 0) {
        name = name + '@' + state.parent.name;
      }
      views[name] = view;
    });
    this.preparedViews = views;
  };

  StateBase.prototype.resetUrlHandlers = function() {};

  StateBase.prototype.newInstance = function() {
    return new StateBase();
  };

  //*********************************************
  // getChild
  //*********************************************
  StateBase.prototype.getChild = function(localName) {
    return (this.children)
      ? this.children[localName]
      : null;
  };


  //*********************************************
  // setChild
  //*********************************************
  //this redefines the child in place (i.e. doesn't wipe out its children)
  StateBase.prototype.setChild = function(stateDef, deep) {
    var state = this.newInstance();
    common.extend(state, stateDef);

    return this.setChildState(state, deep);
  };

  //*********************************************
  // removeChild
  //*********************************************
  //undefines the child (and any descendants of the child)
  StateBase.prototype.removeChild = function(localName) {
    if (this.children[localName]) {
      delete this.children[localName];
    }
    //this._needsInit = true;
    return this;
  };


  //*********************************************
  // setChildState
  //*********************************************
  //this redefines the child in place (i.e. doesn't wipe out its children)
  StateBase.prototype.setChildState = function(state, deep) {
    if (!deep) {
      var existingChild = this.getChild(state.localName);
      var existingChildren = (existingChild)
        ? existingChild.children
        : null;

      if (existingChildren) {
        state._children = existingChildren;
      }

    }

    this.children[state.localName] = state;
    state.parent = this;
    this.needsInit = true;
    return state;
  };


  //*********************************************
  // updateChild
  //*********************************************
  //this updates properties of the child in place (i.e. doesn't wipe out its children)
  //nor does it start with a fresh state, so properties not overwritten are maintained
  //however, if no existing state, a new one is created
  StateBase.prototype.updateChild = function(stateDef) {
    var state = this.getChild(stateDef.localName);
    if (!state) {
      // deep doesn't really matter since this will be a new state, but
      // for form it's set to true
      return this.setChild(stateDef, true);
    }
    else {
      common.extend(state, stateDef);

      return this.setChildState(state, false);
    }
  };

  //*********************************************
  // prepareFlatDefinition
  //*********************************************
  StateBase.prototype.prepFlatGetParent = function(stateDef) {
    var parent, localName;
    if (stateDef.parent) {
      parent = this.getState(stateDef.parent);
      localName = stateDef.fullName;
    }
    else
    {
      var fullName = stateDef.fullName
        ? stateDef.fullName
        : stateDef.name;

      var parts = /^(.*?)\.?([^\.]*)$/.exec(fullName);

      var parentName = parts[1];
      localName = parts[2];

      parent = parentName
        ? this.getState(parentName)
        : this.root;
    }

    stateDef.localName = localName;

    delete stateDef.name;
    delete stateDef.fullName;
    delete stateDef.parent;

    return parent;
  };


  //*********************************************
  // setState
  //*********************************************
  //specify name/fullName in the definition to indicate
  //parent (which must already exist) -- for compatibility
  //with ui-router or other non-oo definition style
  StateBase.prototype.setState = function(stateDef, deep) {
    var parent = this.prepFlatGetParent(stateDef);

    return parent.setChild(stateDef, deep);
  };

  //*********************************************
  // updateState
  //*********************************************
  //specify name/fullName in the definition to indicate
  //parent (which must already exist) -- for compatibility
  //with ui-router or other non-oo definition style
  StateBase.prototype.updateState = function(stateDef) {
    var parent = this.prepFlatGetParent(stateDef);

    return parent.updateChild(stateDef);
  };

  //*********************************************
  // findState
  //*********************************************
  StateBase.prototype.findState = function(partialName) {
    var parts = /^([^\.]+)(\.(.*))?$/.exec(partialName);
    var firstPart = parts[1];
    if (this.localName === firstPart)
    {
      //first part matches this node
      //grab the rest of the name
      var rest = parts[3];
      if (rest) {
        return this.findStateChildren(rest);
      }
      else {
        //there is no 'rest' -- we've found the state
        return this;
      }
    }
    else {
      //this is not a path for this partialName
      return null;
    }
  };

  //*********************************************
  // findStateChildren
  //*********************************************
  StateBase.prototype.findStateChildren = function(partialName) {
    if (this.children) {
      for (var child in this.children) {
        var found = this.children[child].findState(partialName);
        if (found) {
          return found;
        }
      }
    }
    //nothing was found
    return null;
  };

  //*********************************************
  // getState
  //*********************************************
  StateBase.prototype.getState = function(state) {
    if (!common.isString(state)) {
      return this.root.findStateChildren(state.fullName);
    }
    else {
      return this.root.findStateChildren(state);
    }
  };

  //*********************************************
  // JSON support
  //*********************************************
  StateBase.prototype.getIntJson = function(object, longPropertyName, shortPropertyName) {
    return object[shortPropertyName]
      ? parseInt(object[shortPropertyName], 10)
      : object[longPropertyName]
        ? parseInt(object[longPropertyName], 10)
        : null;
  };

  StateBase.prototype.getObjJson = function(object, longPropertyName, shortPropertyName) {
    return object[shortPropertyName]
      ? object[shortPropertyName]
      : object[longPropertyName]
        ? object[longPropertyName]
        : null;
  };

  function jsonConvertOne(object, longPropertyName, shortPropertyName, expand) {
    //default is to contract
    expand = typeof expand !== 'undefined' ? expand : false;
    if (expand) {
      var temp = longPropertyName;
      longPropertyName = shortPropertyName;
      shortPropertyName = temp;
    }

    if (object[longPropertyName]) {
      object[shortPropertyName] = object[longPropertyName];
      delete object[longPropertyName];
    }
  }

  //default is contract
  StateBase.prototype.jsonConvert = function(stateJson, expand) {
    jsonConvertOne(stateJson, 'lazy', 'z', expand);
    jsonConvertOne(stateJson, 'delete', 'x', expand);
    jsonConvertOne(stateJson, 'definition', 'd', expand);
    var definition = stateJson.definition || stateJson.d;

    if (definition) {
      jsonConvertOne(definition, 'url', 'u', expand);
      jsonConvertOne(definition, 'dependencies', 'd', expand);
      jsonConvertOne(definition, 'resolveByService', 'r', expand);
      jsonConvertOne(definition, 'templateService', 'i', expand);
      jsonConvertOne(definition, 'aliases', 's', expand);
      jsonConvertOne(definition, 'controller', 'c', expand);
      jsonConvertOne(definition, 'templateUrl', 't', expand);
      jsonConvertOne(definition, 'template', 'l', expand);
      jsonConvertOne(definition, 'data', 'a', expand);
      jsonConvertOne(definition, 'abstract, ', 'b', expand);
      jsonConvertOne(definition, 'views', 'v', expand);

      var views = definition.views || definition.v;
      if (views) {
        for (var viewName in views) {
          var view = views[viewName];
          jsonConvertOne(view, 'url', 'u', expand);
          jsonConvertOne(view, 'resolveByService', 'r', expand);
          jsonConvertOne(view, 'templateService', 'i', expand);
          jsonConvertOne(view, 'controller', 'c', expand);
          jsonConvertOne(view, 'templateUrl', 't', expand);
          jsonConvertOne(view, 'template', 'l', expand);
          jsonConvertOne(view, 'data', 'a', expand);
        }
      }
    }

    jsonConvertOne(stateJson, 'children', 'c', expand);
    var children = stateJson.children || stateJson.c;
    if (children) {
      for (var childName in children) {
        var childJson = children[childName];
        this.jsonConvert(childJson, expand);
      }
    }
  };

  //childJson should already be expanded
  StateBase.prototype.mergeChild = function(name, childJson) {
    //the name of the child we're working with
    if (childJson['delete']) {
      this.removeChild(name);
    }
    else
    {
      var definition = childJson.definition;
      if (definition) {
        //a definition is specified -- update child
        definition.localName = name;
        this.updateChild(definition);
      }

      var children = childJson.children;
      if (children) {
        var thisChild = this.getChild(name);
        for (var grandchildName in children) {
          var grandChild = children[grandchildName];
          thisChild.mergeChild(grandchildName, grandChild);
        }
      }
    }

    return true;
  };

  Object.defineProperty(StateBase.prototype, 'knownStates', {
    get: function() {
      var summary = {};

      if (Object.keys(this.children).length > 0) {
        var children = {};
        for (var childName in this.children) {
          var child = this.children[childName];
          children[child.localName] = child.knownStates;
        }
        summary = children;
      }

      return summary;
    }
  });

  return StateBase;

});
