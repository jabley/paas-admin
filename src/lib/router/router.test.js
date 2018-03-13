import {test} from 'tap';
import express from 'express';
import request from 'supertest';
import nunjucks from 'nunjucks';
import {router, route} from '.';

function VIEW_HOME() {
  return {};
}

function GET_WORLD() {
  return {name: 'World'};
}

function GET_NAME({name}) {
  return {name};
}

function GET_FULL_NAME({firstName, lastName}) {
  return {name: `${firstName} ${lastName}`};
}

function GET_THING(params) {
  return {id: params.id};
}

function template(data) {
  return nunjucks.renderString(`Hello, {{name}}!`, data);
}

test('routes the url to the correct template function', async t => {
  const app = createExpressApp(router([
    route(GET_WORLD, {
      url: '/hello',
      component: {template}
    })
  ]));
  const response = await request(app).get('/hello');
  t.contains(response.text, 'Hello, World!');
});

test('adds route-params to the action arguments', async t => {
  const app = createExpressApp(router([
    route(GET_NAME, {
      url: '/hello/:name',
      component: {template}
    })
  ]));
  const response = await request(app).get('/hello/Jeff');
  t.contains(response.text, 'Hello, Jeff!');
});

test('adds search-params to the action arguments', async t => {
  const app = createExpressApp(router([
    route(GET_NAME, {
      url: '/hello',
      component: {template}
    })
  ]));
  const response = await request(app).get('/hello?name=Kate');
  t.contains(response.text, 'Hello, Kate!');
});

test('adds body-params to the action arguments', async t => {
  const app = createExpressApp(router([
    route(GET_NAME, {
      method: 'POST',
      url: '/hello',
      component: {template}
    })
  ]));
  const response = await request(app)
    .post('/hello')
    .type('form')
    .send({name: 'Berty'});
  t.contains(response.text, 'Hello, Berty!');
});

test('adds default-params to the action arguments', async t => {
  const app = createExpressApp(router([
    route(GET_NAME, {
      url: '/hello',
      component: {template},
      defaultParams: {
        name: 'Bob'
      }
    })
  ]));
  const response = await request(app).get('/hello');
  t.contains(response.text, 'Hello, Bob!');
});

test('validates required params', async t => {
  const app = createExpressApp(router([
    route(GET_FULL_NAME, {
      url: '/hello/:firstName',
      required: ['lastName'],
      component: {template}
    })
  ]));
  const response = await request(app).get('/hello/Jeff');
  t.contains(response.text, `should have required property`);
});

test('validates paramsTypes', async t => {
  const app = createExpressApp(router([
    route(GET_FULL_NAME, {
      url: '/hello/:id',
      paramTypes: {
        id: {type: 'number'}
      },
      component: {template}
    })
  ]));
  const response = await request(app).get('/hello/not-a-number');
  t.contains(response.text, `should be number`);
});

test('casts params to number if set in paramTypes', async t => {
  const app = createExpressApp(router([
    route(GET_THING, {
      url: '/thing/:id',
      paramTypes: {
        id: {type: 'number'}
      },
      component: {template: data => JSON.stringify(data.id)}
    })
  ]));
  const response = await request(app).get('/thing/123');
  t.contains(response.text, `123`);
});

test('adds a url helper to req', async t => {
  const app = createExpressApp(router([
    route(VIEW_HOME, {
      url: '/',
      component: {
        template: data => nunjucks.renderString(`<a href="{{ routes.GET_NAME.url({"name": "Alice"}) }}">say hi</a>`, data)
      }
    }),
    route(GET_NAME, {
      url: '/hello/:name',
      component: {
        template: () => ''
      }
    })
  ]));
  const response = await request(app).get('/');
  t.contains(response.text, '<a href="/hello/Alice">say hi</a>');
});

test('url helper works for routes without passing params argument', async t => {
  const app = createExpressApp(router([
    route(VIEW_HOME, {
      url: '/',
      component: {
        template: data => nunjucks.renderString(`<a href="{{ routes.VIEW_HOME.url() }}">home</a>`, data)
      }
    })
  ]));
  const response = await request(app).get('/');
  t.contains(response.text, '<a href="/">home</a>');
});

test('url helper adds extra params to querystring', async t => {
  const app = createExpressApp(router([
    route(VIEW_HOME, {
      url: '/',
      component: {
        template: data => nunjucks.renderString(`<a href="{{ routes.GET_NAME.url({"name": "Alice", "a": 1, "b": 2}) }}">say hi</a>`, data)
      }
    }),
    route(GET_NAME, {
      url: '/hello/:name',
      component: {
        template: () => ''
      }
    })
  ]));
  const response = await request(app).get('/');
  t.contains(response.text, '<a href="/hello/Alice?a=1&amp;b=2">say hi</a>');
});

function createExpressApp(router) {
  const app = express();
  app.use(express.urlencoded({extended: true}));
  app.use(router);
  return app;
}
