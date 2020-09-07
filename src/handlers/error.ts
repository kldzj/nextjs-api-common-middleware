import { NextApiResponse } from 'next';
import { PossiblyAuthedNextApiHandler, PossiblyAuthedNextApiRequest, GenericOptions } from '../types';
import { catchHandlerError } from '../utils';

export interface ErrorHandlerOptions extends GenericOptions {}

/**
 * Do not import and use directly, the error-guard comes from the middleware factory.
 * Useful if you re-export the middleware collection with your own global catch configuration.
 * Handlers that don't need any other middleware can use `m.error` to have consistent error handling behavior.
 * @internal
 */
export default function error(
	handler: PossiblyAuthedNextApiHandler,
	opts?: ErrorHandlerOptions
): PossiblyAuthedNextApiHandler {
	return async (req: PossiblyAuthedNextApiRequest, res: NextApiResponse) => {
		await catchHandlerError(handler, req, res, opts);
	};
}
