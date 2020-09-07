import { IncomingHttpHeaders } from 'http';
import { NextApiResponse } from 'next';
import { PossiblyAuthedNextApiHandler, PossiblyAuthedNextApiRequest, GenericOptions } from './types';

export async function catchHandlerError<T extends GenericOptions>(
	handler: PossiblyAuthedNextApiHandler,
	req: PossiblyAuthedNextApiRequest,
	res: NextApiResponse,
	opts?: T
) {
	try {
		await handler(req, res);
	} catch (error) {
		if (opts?.catch) {
			opts.catch(req, res, error);
		} else {
			handleDefaultError(res, error);
		}
	}
}

/**
 * @internal
 */
export function handleDefaultError(res: NextApiResponse, error: any) {
	if (error) console.error(error);
	res.status(500).send('An unexpected error occurred, please try again.');
}

/**
 * @internal
 */
export async function maybePromise<R = any>(func: Function, ...args: any[]): Promise<R> {
	const possiblyPromise = func(...args);
	if (possiblyPromise instanceof Promise) {
		return await possiblyPromise;
	}
	return possiblyPromise;
}

/**
 * @internal
 */
export function ensureString(value: string | string[], glue: string = ','): string {
	if (Array.isArray(value)) {
		return value.join(glue);
	}
	return value;
}

/**
 * @internal
 */
export function _getHeaderValue(name: string, headers: IncomingHttpHeaders) {
	const idx = Object.keys(headers).findIndex((key) => key.toLowerCase() === name.toLowerCase());
	if (idx === -1) return null;
	return Object.values(headers)[idx];
}

/**
 * @internal
 */
export async function _runHandler(
	handler: PossiblyAuthedNextApiHandler,
	req: PossiblyAuthedNextApiRequest,
	res: NextApiResponse
) {
	const maybePromise = handler(req, res);
	if (maybePromise instanceof Promise) {
		await maybePromise;
	}
}
