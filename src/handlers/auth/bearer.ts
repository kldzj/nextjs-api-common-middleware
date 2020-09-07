import { NextApiResponse } from 'next';
import jwt, { VerifyOptions as JWTVerifyOptions, Secret } from 'jsonwebtoken';
import { GenericAuthHandlerOptions, AuthHandlerResult, UserInfo, UserId } from './';
import { PossiblyAuthedNextApiRequest } from '../../types';
import { _getHeaderValue } from '../../utils';

interface GenericBearerAuthHandlerOptions extends GenericAuthHandlerOptions {
	strategy: 'bearer';
	/**
	 * Provide a function that returns a user by its id.
	 */
	getUser: (userId: UserId) => Promise<UserInfo> | UserInfo;
}

export interface DefaultBearerAuthHandlerOptions extends GenericBearerAuthHandlerOptions {
	/**
	 * The private or public secret that will be passed to the `jsonwebtoken.verify` call.
	 * Will only be used if you do not provide your own decodeToken function.
	 */
	secret: Secret;
	/**
	 * The name of the key that contains the user id in the decoded token.
	 */
	uidKey: string;
	/**
	 * Add options to the `jsonwebtoken.verify` call.
	 * Will only be used if you do not provide your own decodeToken function.
	 */
	jwtOptions?: JWTVerifyOptions;
}

export interface CustomBearerAuthHandlerOptions extends GenericBearerAuthHandlerOptions {
	/**
	 * Provide your own token decode function. Must return the user id contained in the token.
	 */
	decodeToken: (token: string) => Promise<UserId> | UserId;
}

export type BearerAuthHandlerOptions = DefaultBearerAuthHandlerOptions | CustomBearerAuthHandlerOptions;

/**
 * @internal
 */
export const bearerAuthHandler = async (
	req: PossiblyAuthedNextApiRequest,
	opts: BearerAuthHandlerOptions
): Promise<AuthHandlerResult> => {
	let headerValue = _getHeaderValue(opts.headerName ?? 'Authorization', req.headers);
	if (!headerValue) return req;
	if (Array.isArray(headerValue)) {
		headerValue = headerValue.join('');
	}

	const token = headerValue.replace(/bearer\s+/i, '');
	if (!token) return req;

	let userId: UserId;
	if (opts.decodeToken) {
		let maybePromise = opts.decodeToken(token);
		if (maybePromise instanceof Promise) {
			maybePromise = await maybePromise;
		}
		userId = maybePromise;
	} else {
		try {
			const decoded = jwt.verify(token, opts.secret, { ...opts.jwtOptions }) as { [key: string]: any };
			if (!decoded) return req;
			if (typeof decoded === 'string') return req;
			userId = decoded[opts.uidKey];
		} catch (_error) {
			return req;
		}
	}

	if (!userId) return req;
	req.uid = userId;

	let maybePromise = opts.getUser(userId);
	if (maybePromise instanceof Promise) {
		maybePromise = await maybePromise;
	}

	const user = maybePromise;
	req.user = user;

	return req;
};
