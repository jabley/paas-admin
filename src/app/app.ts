import compression from 'compression';
import cookieSession from 'cookie-session';
import express from 'express';
import pinoMiddleware from 'express-pino-logger';
import staticGzip from 'express-static-gzip';
import helmet from 'helmet';
import { IncomingMessage, ServerResponse } from 'http';
import { BaseLogger } from 'pino';

import auth from '../auth';
import { internalServerErrorMiddleware, pageNotFoundMiddleware } from '../errors';
import { expressMiddleware as routerMiddleware } from '../lib/router';

import csp from './app.csp';
import router from './router';

export interface IAppConfig {
  readonly allowInsecureSession?: boolean;
  readonly billingAPI: string;
  readonly cloudFoundryAPI: string;
  readonly logger: BaseLogger;
  readonly notifyAPIKey: string;
  readonly notifyWelcomeTemplateID: string | null;
  readonly oauthClientID: string;
  readonly oauthClientSecret: string;
  readonly sessionSecret: string;
  readonly uaaAPI: string;
}

export default function(config: IAppConfig) {
  const app = express();

  app.use(pinoMiddleware({
    logger: config.logger,
    serializers: {
      req: (req: IncomingMessage) => ({
        method: req.method,
        url: req.url,
      }),
      res: /* istanbul ignore next */ (res: ServerResponse) => ({
        status: res.statusCode,
      }),
    },
  }));

  app.set('trust proxy', true);

  app.use(cookieSession({
    name: 'pazmin-session',
    keys: [config.sessionSecret],
    secure: !config.allowInsecureSession,
    httpOnly: true,
  }));

  app.use('/assets', staticGzip('dist/assets', {immutable: true}));
  app.use(compression());

  app.use(helmet());
  app.use(helmet.contentSecurityPolicy(csp));

  app.use(express.urlencoded({extended: true}));

  app.get('/healthcheck', (_req: express.Request, res: express.Response) => res.send({message: 'OK'}));

  // Authenticated endpoints follow
  app.use(auth(config));

  app.use(routerMiddleware(router, config));

  app.use(pageNotFoundMiddleware);
  app.use(internalServerErrorMiddleware);

  return app;
}
