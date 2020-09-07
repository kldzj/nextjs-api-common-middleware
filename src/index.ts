import { auth, rest, guard, error, cors } from './handlers';
import { RestMiddlewareHandlers, RestHandlerOptions } from './handlers/rest';
import { AuthHandlerOptions } from './handlers/auth';
import { GuardHandlerOptions } from './handlers/guard';
import { ErrorHandlerOptions } from './handlers/error';
import { handleDefaultError, catchHandlerError } from './utils';
import {
	NextApiResponse,
	PossiblyAuthedNextApiHandler,
	PossiblyAuthedNextApiRequest,
	MiddlewareHandler,
	MiddlewareOptions,
	GenericOptions,
} from './types';
import { CorsHandlerOptions } from './handlers/cors';

export function chain(
	middleware: MiddlewareHandler[],
	handler: PossiblyAuthedNextApiHandler,
	opts: MiddlewareOptions = {}
): PossiblyAuthedNextApiHandler {
	return async (req: PossiblyAuthedNextApiRequest, res: NextApiResponse) => {
		if (middleware.length === 0) {
			catchHandlerError(handler, req, res, opts);
			return;
		}

		const recursiveStepThrough = async (
			req: PossiblyAuthedNextApiRequest,
			res: NextApiResponse,
			idx: number = 0
		): Promise<void> => {
			const mw = middleware[idx];
			if (!mw) {
				await handler(req, res);
				return;
			}

			const next: PossiblyAuthedNextApiHandler = async (req, res) => {
				await recursiveStepThrough(req, res, idx + 1);
			};

			if (!req._mws) req._mws = [];
			req._mws.push(mw.name);
			await mw(next, opts[mw.name])(req, res);
		};

		await recursiveStepThrough(req, res);
	};
}

/**
 * @internal
 */
function withDefaultOptions(options?: MiddlewareOptions): MiddlewareOptions {
	return {
		catch: (_req: PossiblyAuthedNextApiRequest, res: NextApiResponse, error: any) => handleDefaultError(res, error),
		auth: {
			strategy: 'none',
		},
		...options,
	};
}

/**
 * @internal
 */
function middlewareHandlerFactory<T extends GenericOptions>(mw: MiddlewareHandler, _opts: T) {
	if (typeof mw !== 'function') {
		throw new Error('Middleware handler must be a function');
	}

	return (handler: PossiblyAuthedNextApiHandler, opts?: T): PossiblyAuthedNextApiHandler => {
		const mergedOpts = { ..._opts, ...opts };
		return mw(handler, mergedOpts);
	};
}

/**
 * @internal
 */
type Partial<T> = {
	[P in keyof T]?: T[P];
};

function createExport(_options?: MiddlewareOptions) {
	const options = withDefaultOptions(_options);
	const withCatcher = <T extends GenericOptions>(opts?: T): T => ({ catch: options.catch, ...opts } as T);

	return {
		rest: (handlers: RestMiddlewareHandlers, opts?: Partial<RestHandlerOptions>) =>
			rest(handlers, withCatcher({ ...options.rest, ...opts })),
		auth: middlewareHandlerFactory<Partial<AuthHandlerOptions>>(auth, withCatcher(options.auth)),
		cors: middlewareHandlerFactory<Partial<CorsHandlerOptions>>(cors, withCatcher(options.cors)),
		error: middlewareHandlerFactory<Partial<ErrorHandlerOptions>>(error, withCatcher<ErrorHandlerOptions>()),
		guard: middlewareHandlerFactory<Partial<GuardHandlerOptions>>(guard, withCatcher(options.guard)),
		_: {
			chain: (
				middleware: MiddlewareHandler[],
				handler: PossiblyAuthedNextApiHandler,
				opts?: MiddlewareOptions
			): PossiblyAuthedNextApiHandler => chain(middleware, handler, { ...options, ...opts }),
			createExport: (opts?: MiddlewareOptions) => createExport({ ...options, ...opts }),
		},
	};
}

export { createExport, auth, rest, guard };

export { PossiblyAuthedNextApiRequest, PossiblyAuthedNextApiHandler } from './types';

export default createExport();
