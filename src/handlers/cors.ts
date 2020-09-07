import { NextApiResponse } from 'next';
import { catchHandlerError, ensureString, maybePromise } from '../utils';
import { GenericOptions, PossiblyAuthedNextApiHandler, PossiblyAuthedNextApiRequest } from '../types';

export type CorsOriginHandlerResult = string | string[];
export type CorsOriginHandler = (
	req: PossiblyAuthedNextApiRequest
) => Promise<CorsOriginHandlerResult> | CorsOriginHandlerResult;

export interface CorsHandlerOptions extends GenericOptions {
	maxAge?: number | string;
	origin?: string | string[] | RegExp | CorsOriginHandler;
	exposedHeaders?: string[];
	allowedHeaders?: string[];
	allowedMethods?: string[];
	allowCredentials?: boolean;
}

export default function cors(handler: PossiblyAuthedNextApiHandler, opts?: CorsHandlerOptions) {
	return async (_req: PossiblyAuthedNextApiRequest, _res: NextApiResponse) => {
		const unsafeHandler = async (req: PossiblyAuthedNextApiRequest, res: NextApiResponse) => {
			const set = (suffix: string, value: string) => res.setHeader(`Access-Control-${suffix}`, value);

			if (opts?.maxAge) {
				set('Max-Age', opts.maxAge.toString());
			}

			if (opts?.origin) {
				let origin = null;
				if (typeof opts.origin === 'string' || Array.isArray(opts.origin)) {
					origin = ensureString(opts.origin);
				} else if (opts.origin instanceof RegExp) {
					if (req.headers.origin && opts.origin.test(req.headers.origin)) {
						origin = req.headers.origin;
					}
				} else if (typeof opts.origin === 'function') {
					const value = await maybePromise<CorsOriginHandlerResult>(opts.origin, req);
					if (value) {
						origin = ensureString(value);
					}
				}

				if (origin) set('Allow-Origin', origin);
			}

			if (opts?.exposedHeaders) {
				set('Expose-Headers', opts.exposedHeaders.join(','));
			}

			if (opts?.allowedHeaders) {
				set('Allow-Headers', opts.allowedHeaders.join(','));
			}

			if (opts?.allowedMethods) {
				set('Allow-Methods', opts.allowedMethods.join(','));
			}

			if (opts?.allowCredentials) {
				set('Allow-Credentials', opts.allowCredentials.toString());
			}

			await handler(req, res);
		};

		await catchHandlerError(unsafeHandler, _req, _res, opts);
	};
}
