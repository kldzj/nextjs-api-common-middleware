import { createMocks } from 'node-mocks-http';
import { rest } from '../../src';
import { defaultHandler } from '../setup';

const NOT_IMPLEMENTED = 'Not implemented';

describe('rest middleware', () => {
	const handler = rest(
		{
			get: defaultHandler,
			post: defaultHandler,
		},
		{
			catch: (_req, res, error) => res.status(400).send(error?.message),
			notImplemented: NOT_IMPLEMENTED,
		}
	);

	test('works as expected if method is implemented', async () => {
		const { req, res } = createMocks({
			method: 'GET',
		});

		await handler(req, res);

		expect(res._getStatusCode()).toBe(200);
		expect(res._getData()).toBe('OK');
	});

	test('works as expected if method is not implemented', async () => {
		const { req, res } = createMocks({
			method: 'PUT',
		});

		await handler(req, res);

		expect(res._getStatusCode()).toBe(400);
		expect(res._getData()).toBe(NOT_IMPLEMENTED);
	});
});
