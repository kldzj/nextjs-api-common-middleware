import { createMocks } from 'node-mocks-http';
import m from '../../src';
import { defaultHandler, throwingHandler } from '../setup';

describe('error middleware', () => {
	test('works as expected if no error is thrown', async () => {
		const { req, res } = createMocks({
			method: 'GET',
		});

		await m.error(defaultHandler)(req, res);

		expect(res._getStatusCode()).toBe(200);
		expect(res._getData()).toBe('OK');
	});

	test('works as expected if an error is thrown', async () => {
		const { req, res } = createMocks({
			method: 'GET',
		});

		await m.error(throwingHandler, {
			catch(_req, res, error) {
				res.status(500).send('ERROR');
			},
		})(req, res);

		expect(res._getStatusCode()).toBe(500);
		expect(res._getData()).toBe('ERROR');
	});
});
