import { NextApiResponse } from 'next';
import { _getHeaderValue } from '../../utils';
import { GenericAuthHandlerOptions, UserInfo, AuthHandlerResult } from './';
import { PossiblyAuthedNextApiRequest } from '../../types';

export interface CustomAuthHandlerOptions extends GenericAuthHandlerOptions {
	strategy: 'custom';
	/**
	 * For convenience only, remove provided string/pattern from the header value before it's passed to your auth handler.
	 */
	headerPrefix?: string | RegExp;
	/**
	 * Trim the header value before it's passed to your auth handler.'
	 */
	trimHeaderValue?: boolean;
	/**
	 * If the provided function evaluates to true access will be granted. It will be passed the header value and request object.
	 */
	custom: (headerValue: string, req: PossiblyAuthedNextApiRequest) => Promise<UserInfo> | UserInfo;
}

/**
 * @internal
 */
export const customAuthHandler = async (
	req: PossiblyAuthedNextApiRequest,
	opts: CustomAuthHandlerOptions
): Promise<AuthHandlerResult> => {
	let headerValue = _getHeaderValue(opts.headerName ?? 'Authorization', req.headers);

	if (!headerValue) {
		return req;
	}

	if (Array.isArray(headerValue)) {
		headerValue = headerValue.join(',');
	}

	if (opts.headerPrefix) {
		const regexRepl = new RegExp(`${opts.headerPrefix} `, 'i');
		const replacer = opts.headerPrefix instanceof RegExp ? opts.headerPrefix : regexRepl;
		headerValue = headerValue.replace(replacer, '');
	}

	if (opts.trimHeaderValue) {
		headerValue = headerValue.trim();
	}

	let maybePromise = opts.custom(headerValue, req);
	if (maybePromise instanceof Promise) {
		maybePromise = await maybePromise;
	}

	const result = maybePromise;
	if (!result || !result.uid || !result.user) {
		return req;
	}

	req.uid = result.uid;
	req.user = result.user;

	return req;
};
