import { createMocks } from 'node-mocks-http';
import { createExport, auth } from '../src';
import { defaultHandler } from './setup';

describe('export', () => {
	test('createExport does not throw and contains middleware', () => {
		const m = createExport();

		expect(m).toHaveProperty('auth');
		expect(m).toHaveProperty('rest');
		expect(m).toHaveProperty('guard');
		expect(m).toHaveProperty('error');
		expect(m).toHaveProperty('_');
	});

	test('createExport configuration gets merged', async () => {
		const m = createExport({
			auth: {
				strategy: 'basic',
				basic: () => ({ uid: 1, user: { name: 'test' } }),
			},
		});

		const { req, res } = createMocks({
			method: 'GET',
			headers: {
				test: 'basic test:test',
			},
		});

		await m.auth(defaultHandler, { headerName: 'test' })(req, res);

		expect(res._getStatusCode()).toBe(200);
		expect(res._getData()).toBe('OK');
	});
});
