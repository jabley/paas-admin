import pino from 'pino';
import sourceMapSupport from 'source-map-support';

import app, { IAppConfig } from './app/app';
import Server from './server';

sourceMapSupport.install();

const logger = pino({
  level: process.env.LOG_LEVEL || 'warn',
});

function getEnvVariable(variableName: string, required?: boolean, defaultValue?: string): string {
  const value = process.env[variableName] || '';
  if (value === '') {
    if (required) {
      logger.error(`Expected environment variable "${variableName}" to be set.`);
      process.exit(100);
    } else if (defaultValue) {
      return defaultValue;
    }
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

async function main(cfg: IAppConfig) {
  const server = new Server(app(cfg), {
    port: parseInt(process.env.PORT || '0', 10),
  });

  process.once('SIGINT', () => server.stop());
  process.once('SIGTERM', () => server.stop());

  await server.start();
  pino().info({port: server.http.address().port}, `listening http://localhost:${server.http.address().port}/`);

  /* istanbul ignore if  */
  if (module.hot) {
    module.hot.accept();
    // module.hot.accept('./app', () => server.update(app(cfg)));
  }

  return server.wait();
}

const isSingleUserMode = getEnvVariable('SINGLE_USER_ACCESS_TOKEN', false) !== '';

const config = {
  logger,
  sessionSecret: getEnvVariable('SESSION_SECRET', false, 'mysecret'),
  allowInsecureSession: (process.env.ALLOW_INSECURE_SESSION === 'true'),
  oauthAuthorizationURL: getEnvVariable('OAUTH_AUTHORIZATION_URL', !isSingleUserMode, '[no-auth-url-set]'),
  oauthTokenURL: getEnvVariable('OAUTH_TOKEN_URL', !isSingleUserMode, '[no-token-url-set]'),
  oauthClientID: getEnvVariable('OAUTH_CLIENT_ID', !isSingleUserMode, '[no-client-id-set]'),
  oauthClientSecret: getEnvVariable('OAUTH_CLIENT_SECRET', !isSingleUserMode, '[no-client-secret-set]'),
  singleUserAccessToken: getEnvVariable('SINGLE_USER_ACCESS_TOKEN', false),
  cloudFoundryAPI: getEnvVariable('API_URL', true),
  uaaAPI: getEnvVariable('UAA_URL', !isSingleUserMode, '[no-uaa-url-set]'),
  notifyAPIKey: getEnvVariable('NOTIFY_API_KEY', !isSingleUserMode, '[no-notify-api-key-set]'),
  notifyWelcomeTemplateID: getEnvVariable('NOTIFY_WELCOME_TEMPLATE_ID', false),
};

main(config).then(onShutdown).catch(onError);
