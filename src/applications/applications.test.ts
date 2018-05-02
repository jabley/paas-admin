import jwt from 'jsonwebtoken';
import nock from 'nock';
import pino from 'pino';
import { test } from 'tap';

import { config } from '../app/app.test';
import { IContext } from '../app/context';
import { Token } from '../auth';
import * as data from '../cf/cf.test.data';

import { viewApplication } from '.';

nock('https://example.com/api').persist()
  .get('/v2/apps/15b3885d-0351-4b9b-8697-86641668c123').times(1).reply(200, data.app)
  .get('/v2/apps/15b3885d-0351-4b9b-8697-86641668c123/summary').times(1).reply(200, data.appSummary)
  .get('/v2/spaces/7846301e-c84c-4ba9-9c6a-2dfdae948d52').times(1).reply(200, data.space)
  .get('/v2/spaces/1053174d-eb79-4f16-bf82-9f83a52d6e84').times(1).reply(200, data.space)
  .get('/v2/organizations/6e1ca5aa-55f1-4110-a97f-1f3473e771b9').times(1).reply(200, data.organization);

const tokenKey = 'secret';
const token = jwt.sign({
  user_id: 'uaa-user-123',
  scope: [],
  exp: 2535018460,
}, tokenKey);
const ctx: IContext = {
  app: config,
  routePartOf: () => false,
  linkTo: () => '__LINKED_TO__',
  log: pino({level: 'silent'}),
  token: new Token(token, [tokenKey]),
};

test('should show the application overview page', async t => {
  const response = await viewApplication(ctx, {
    applicationGUID: '15b3885d-0351-4b9b-8697-86641668c123',
    organizationGUID: '6e1ca5aa-55f1-4110-a97f-1f3473e771b9',
    spaceGUID: '7846301e-c84c-4ba9-9c6a-2dfdae948d52',
  });

  t.contains(response.body, /name-79 - Application Overview/);
});
