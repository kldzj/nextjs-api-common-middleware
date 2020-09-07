import { NextApiResponse } from 'next';
import { GenericAuthHandlerOptions, AuthHandlerResult, UserInfo } from './';
import { PossiblyAuthedNextApiRequest } from '../../types';
import { _getHeaderValue } from '../../utils';

export interface BasicAuthHandlerOptions extends GenericAuthHandlerOptions {
	strategy: 'basic';
	/**
	 * A function that will be called with the provided username and password.
	 * Grants access if this function evaluates to `true`.
	 */
	basic: (username?: string, password?: string) => Promise<UserInfo> | UserInfo;
}

/**
 * @internal
 */
export const basicAuthHandler = async (
	req: PossiblyAuthedNextApiRequest,
	opts: BasicAuthHandlerOptions
): Promise<AuthHandlerResult> => {
	let headerValue = _getHeaderValue(opts.headerName ?? 'Authorization', req.headers);
	if (!headerValue) return req;

	if (Array.isArray(headerValue)) headerValue = headerValue.join(',');

	const [username, password] = headerValue.replace(/basic\s+/i, '').split(':');

	let maybePromise = opts.basic(username, password);
	if (maybePromise instanceof Promise) {
		maybePromise = await maybePromise;
	}

	const result = maybePromise;
	if (!result || !result.uid || !result.user) return req;

	req.uid = result.uid;
	req.user = result.user;
	return req;
};
