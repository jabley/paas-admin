import jwt from 'jsonwebtoken';

export const CLOUD_CONTROLLER_ADMIN = 'cloud_controller.admin';
export const CLOUD_CONTROLLER_READ_ONLY_ADMIN = 'cloud_controller.admin_read_only';
export const CLOUD_CONTROLLER_GLOBAL_AUDITOR = 'cloud_controller.global_auditor';

interface IToken {
  readonly exp: number;
  readonly scope: ReadonlyArray<string>;
  readonly user_id: string;
}

export class Token {
  public readonly expiry: number;
  public readonly scopes: ReadonlyArray<string>;
  public readonly userID: string;

  constructor(public readonly accessToken: string, public readonly signingKeys: ReadonlyArray<string>) {
    const rawToken = verify(accessToken, signingKeys);

    this.expiry = rawToken.exp;
    this.scopes = rawToken.scope;
    this.userID = rawToken.user_id;
  }

  public hasScope(scope: string): boolean {
    return this.scopes.includes(scope);
  }
}

function verify(accessToken: string, signingKeys: ReadonlyArray<string>): IToken {
  const rawToken: any = jwt.verify(accessToken, signingKeys[0]);

  if (typeof rawToken !== 'object') {
    throw new Error('jwt: could not verify the token as no object has been verified');
  }

  if (!rawToken.exp) {
    throw new Error('jwt: could not verify the token as no exp have been decoded');
  }

  if (!Array.isArray(rawToken.scope)) {
    throw new Error('jwt: could not verify the token as no scope(s) have been decoded');
  }

  return {
    exp: rawToken.exp,
    scope: rawToken.scope,
    user_id: rawToken.user_id,
  };
}
