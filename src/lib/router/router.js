import {URL} from 'url';
import RouteMatcher from 'route-parser';
import Ajv from 'ajv';


function urlFor(r, params) {
  const url = r.route.reverse(params);
  const usedParams = r.route.match(url);
  const u = new URL(url, 'https://localhost');
  for (const key in params) {
    if (!usedParams[key]) {
      u.searchParams.set(key, params[key]);
    }
  }
  return u.pathname + u.search;
}

class Route {
  constructor(action, {name, method, url, component, defaultParams, paramTypes, required}) {
    this.action = action;
    if (typeof this.action !== 'function') {
      throw new TypeError(`route: expected action to be function but received ${typeof this.action}`);
    }
    this.name = name || action.name;
    if (typeof this.name !== 'string') {
      throw new TypeError(`route: expected name to be string but received ${typeof this.name}`);
    }
    this.method = (method || 'GET').toUpperCase();
    if (typeof this.method !== 'string') {
      throw new TypeError(`route: expected method to be string but received ${typeof this.method}`);
    }
    if (typeof url !== 'string') {
      throw new TypeError(`route: expected url to be string but received ${typeof url}`);
    }
    this.route = new RouteMatcher(url);
    this.component = component;
    this.defaultParams = defaultParams || {};
    if (typeof this.defaultParams !== 'object') {
      throw new TypeError(`route: expected defaultParams to be string but received ${typeof this.defaultParams}`);
    }
    if (paramTypes && typeof paramTypes !== 'object') {
      throw new TypeError(`route: expected paramTypes to be a json schema object properties but received ${typeof paramTypes}`);
    }
    this.schema = {
      type: 'object',
      properties: paramTypes || {},
      required: required || [],
      additionalProperties: !paramTypes
    };
    const ajv = new Ajv({coerceTypes: true});
    this.validator = ajv.compile(this.schema);
  }

  match(method, url) {
    if (this.method.toUpperCase() !== method.toUpperCase()) {
      return false;
    }
    return this.route.match(url);
  }

  validate(params) {
    if (!this.validator(params)) {
      const err = this.validator.errors[0];
      if (err.dataPath && err.message) {
        throw new TypeError(`route: invalid params for route ${this.name}: '${err.dataPath}' ${err.message}`);
      }
      if (err.keyword === 'additionalProperties' && err.message) {
        throw new TypeError(`route: invalid params for route ${this.name}: ${err.message} but found '${err.params.additionalProperty}'`);
      }
      if (err.message) {
        throw new TypeError(`route: invalid params for route ${this.name}: ${err.message}`);
      }
      throw new TypeError(`route: invalid params for route ${this.name}: ${JSON.stringify(err)}`);
    }
    return true;
  }

  execute(req) {
    const bodyParams = req.body && typeof req.body === 'object' ? req.body : {};
    const searchParams = req.query;
    const routeParams = this.route.match(req.originalUrl);
    const args = {...this.defaultParams, ...bodyParams, ...searchParams, ...routeParams};
    this.validate(args); // Converts types using json schema see ajv option coerceTypes
    return this.action(args);
  }

  render(req, data) {
    return this.component.template({
      ...data,
      routes: req.routes
    });
  }

}

export function route(action, opts) {
  return new Route(action, opts);
}

function onError(req, res, next) {
  return err => {
    if (!err) {
      err = new Error(`handler for ${req.route} failed but did not return an error message`);
    }
    next(err);
  };
}

export function router(routes) {
  const routeMap = routes.reduce((rs, r) => {
    rs[r.name] = r;
    rs[r.name].url = urlFor.bind(r, r); // TODO: this does not feel right ... what if actions are used in multiple places
    return rs;
  }, {});
  return (req, res, next) => {
    const r = routes.find(r => r.match(req.method, req.originalUrl));
    if (!r) {
      return next();
    }
    req.routes = routeMap;
    Promise.resolve(r.execute(req))
      .then(data => res.send(r.render(req, data)))
      .catch(onError(req, res, next));
  };
}

export function withLayout() {
  throw new Error('notimp');
}
