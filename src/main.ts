import pino from 'pino';
import sourceMapSupport from 'source-map-support';

import app, { IAppConfig } from './app/app';
import CloudFoundryClient from './cf';
import Server from './server';

sourceMapSupport.install();

const logger = pino({
  level: process.env.LOG_LEVEL || 'warn',
});

function expectEnvVariable(variableName: string): string {
  const value = process.env[variableName] || '';

  if (value === '') {
    logger.error(`Expected environment variable "${variableName}" to be set.`);
    process.exit(100);
  }

  return value;
}

function onError(err: Error) {
  logger.error({exit: 1}, err.toString());
  process.exit(100);
}

function onShutdown() {
  logger.info({exit: 0}, 'shutdown gracefully');
  process.exit(0);
}

async function main() {
  const cloudFoundryAPI = expectEnvVariable('API_URL');
  let authorizationAPI = process.env.AUTHORIZATION_URL;
  let uaaAPI = process.env.UAA_URL;

  /* istanbul ignore next */
  if (!authorizationAPI || !uaaAPI) {
    const cf = new CloudFoundryClient({
      apiEndpoint: cloudFoundryAPI,
    });
    const info = await cf.info();
    authorizationAPI = info.authorization_endpoint;
    uaaAPI = info.token_endpoint;
  }

  const config: IAppConfig = {
    logger,
    sessionSecret: process.env.SESSION_SECRET || 'mysecret',
    allowInsecureSession: (process.env.ALLOW_INSECURE_SESSION === 'true'),
    billingAPI: expectEnvVariable('BILLING_URL'),
    oauthClientID: expectEnvVariable('OAUTH_CLIENT_ID'),
    oauthClientSecret: expectEnvVariable('OAUTH_CLIENT_SECRET'),
    cloudFoundryAPI,
    authorizationAPI,
    uaaAPI,
    notifyAPIKey: expectEnvVariable('NOTIFY_API_KEY'),
    notifyWelcomeTemplateID: process.env.NOTIFY_WELCOME_TEMPLATE_ID || null,
  };

  const server = new Server(app(config), {
    port: parseInt(process.env.PORT || '0', 10),
  });

  process.once('SIGINT', () => server.stop());
  process.once('SIGTERM', () => server.stop());

  await server.start();
  pino().info({
    authorizationAPI,
    billingAPI: config.billingAPI,
    cloudFoundryAPI,
    port: server.http.address().port,
    uaaAPI,
  }, `listening http://localhost:${server.http.address().port}/`);

  /* istanbul ignore if  */
  if (module.hot) {
    module.hot.accept();
    // module.hot.accept('./app', () => server.update(app(cfg)));
  }

  return server.wait();
}

main().then(onShutdown).catch(onError);
