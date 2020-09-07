import { NextApiResponse } from 'next';
import { GenericOptions, PossiblyAuthedNextApiHandler, PossiblyAuthedNextApiRequest, HttpMethod } from '../types';
import { catchHandlerError } from '../utils';

type OneHttpMethod = keyof typeof HttpMethod;

export interface GuardHandlerOptions extends GenericOptions {
	mustBe?:
		| {
				method: OneHttpMethod;
				httpStatus?: number;
				errorMessage?: string;
		  }
		| OneHttpMethod;
	required?:
		| {
				fields: string[];
				httpStatus?: number;
				errorMessage?: (missingFields: string[]) => string;
		  }
		| string[];
}

export default function guard(
	handler: PossiblyAuthedNextApiHandler,
	_opts?: GuardHandlerOptions
): PossiblyAuthedNextApiHandler {
	return async (_req: PossiblyAuthedNextApiRequest, _res: NextApiResponse) => {
		const unsafeHandler = async (req: PossiblyAuthedNextApiRequest, res: NextApiResponse) => {
			const opts = {
				mustBe: typeof _opts?.mustBe === 'string' ? { method: _opts.mustBe } : _opts?.mustBe,
				required: Array.isArray(_opts?.required) ? { fields: _opts?.required ?? [] } : _opts?.required,
			};

			if (opts?.mustBe) {
				if (req.method?.toUpperCase() !== opts.mustBe.method) {
					return res
						.status(opts.mustBe.httpStatus ?? 400)
						.json({ error: opts.mustBe.errorMessage ?? 'HTTP method not supported' });
				}
			}

			const params = { ...req.query, ...req.body };
			const missingFields: string[] = [];

			for (const field of opts?.required?.fields ?? []) {
				if (!params[field]) missingFields.push(field);
			}

			if (missingFields.length > 0) {
				return res.status(opts?.required?.httpStatus ?? 400).json({
					error:
						opts?.required?.errorMessage?.(missingFields) ??
						`Missing required field(s): ${missingFields.join(', ')}`,
				});
			}

			await handler(req, res);
		};

		await catchHandlerError(unsafeHandler, _req, _res, _opts);
	};
}
