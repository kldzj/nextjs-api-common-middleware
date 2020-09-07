import { NextApiResponse } from 'next';
import { customAuthHandler, CustomAuthHandlerOptions } from './custom';
import { basicAuthHandler, BasicAuthHandlerOptions } from './basic';
import { bearerAuthHandler, BearerAuthHandlerOptions } from './bearer';
import { PossiblyAuthedNextApiHandler, PossiblyAuthedNextApiRequest, GenericOptions } from '../../types';
import { _runHandler, catchHandlerError } from '../../utils';

export type UserId = string | number | null | undefined;

export interface UserInfoObject {
	uid: UserId;
	user: any | null | undefined;
}

export type UserInfo = UserInfoObject | null | undefined;

export enum AuthStrategy {
	basic,
	bearer,
	custom,
	none,
}

/**
 * @internal
 */
export interface GenericAuthHandlerOptions extends GenericOptions {
	strategy?: keyof typeof AuthStrategy;
	/**
	 * Override the default unauthorized responding behaviour.
	 */
	unauthorized?: (req: PossiblyAuthedNextApiRequest, res: NextApiResponse) => Promise<void> | void;
	/**
	 * Authorization header name, defaults to `Authorization`
	 */
	headerName?: string;
	/**
	 * Enable if unauthorized access should still be possible and the middleware should populate the request with user information.
	 */
	allowAnonymous?: boolean;
	/**
	 * If anonymous access is allowed, this value will be passed to `req.user`, defaults to `null`.
	 */
	anonymousUserValue?: any | null;
}

export interface EmptyAuthHandlerOptions extends GenericAuthHandlerOptions {
	strategy?: 'none';
}

export type AuthHandlerOptions =
	| EmptyAuthHandlerOptions
	| BasicAuthHandlerOptions
	| BearerAuthHandlerOptions
	| CustomAuthHandlerOptions;

/**
 * @internal
 */
export type AuthHandlerResult = PossiblyAuthedNextApiRequest;

/**
 * @internal
 */
function authHandlerFactory(
	req: PossiblyAuthedNextApiRequest,
	opts?: AuthHandlerOptions
): Promise<PossiblyAuthedNextApiRequest> {
	switch (opts?.strategy) {
		case 'none': {
			return new Promise<PossiblyAuthedNextApiRequest>((resolve) => resolve(req));
		}
		case 'custom': {
			return customAuthHandler(req, opts);
		}
		case 'basic': {
			return basicAuthHandler(req, opts);
		}
		case 'bearer': {
			return bearerAuthHandler(req, opts);
		}
		default: {
			throw new Error('Must choose a (valid) strategy in order to use the auth middleware.');
		}
	}
}

export default function auth(
	handler: PossiblyAuthedNextApiHandler,
	opts?: AuthHandlerOptions
): PossiblyAuthedNextApiHandler {
	return async (_req: PossiblyAuthedNextApiRequest, _res: NextApiResponse) => {
		const unsafeHandler = async (__req: PossiblyAuthedNextApiRequest, res: NextApiResponse) => {
			const req = await authHandlerFactory(__req, opts);

			if (opts?.allowAnonymous) {
				if (!req.uid) req.uid = null;
				if (!req.user) req.user = opts.anonymousUserValue;
				await handler(req, res);
				return;
			}

			if (!req.uid || !req.user) {
				if (opts?.unauthorized) {
					const maybePromise = opts.unauthorized(req, res);
					if (maybePromise instanceof Promise) {
						await maybePromise;
					}
				} else {
					res.status(401).json({ error: 'Unauthorized' });
				}
				return;
			}

			await handler(req, res);
		};

		await catchHandlerError(unsafeHandler, _req, _res, opts);
	};
}
