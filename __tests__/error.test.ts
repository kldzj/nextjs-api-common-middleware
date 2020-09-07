import { createMocks } from 'node-mocks-http';
import { handleDefaultError, catchHandlerError } from '../src/utils';
import { throwingHandler } from './setup';

describe('error handlers', () => {
	test('handleDefaultError should run as expected', async () => {
		const { res } = createMocks({
			method: 'GET',
		});

		handleDefaultError(res, new Error('test'));

		expect(res._getStatusCode()).toBe(500);
		expect(res._getData()).toContain('An unexpected error occurred');
	});

	test('catchHandlerError should use handleDefaultError if no catch handler is present', async () => {
		const { req, res } = createMocks({
			method: 'GET',
		});

		await catchHandlerError(throwingHandler, req, res);

		expect(res._getStatusCode()).toBe(500);
		expect(res._getData()).toContain('An unexpected error occurred');
	});
});
