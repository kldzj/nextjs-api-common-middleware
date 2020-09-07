import { createMocks } from 'node-mocks-http';
import { createExport } from '../../src';
import { defaultHandler } from '../setup';

const UNAUTHORIZED_CODE = 401;
const UNAUTHORIZED_TEXT = 'UNAUTHORIZED';

describe('auth (strategy:basic) middleware', () => {
	const m = createExport({
		auth: {
			strategy: 'basic',
			basic: (user, pass) => {
				if (user === 'admin' && pass === 'guest') return { uid: 1, user: { name: 'admin' } };
				return null;
			},
			unauthorized(_req, res) {
				res.status(UNAUTHORIZED_CODE).send(UNAUTHORIZED_TEXT);
			},
		},
	});

	test('works as expected when authorized', async () => {
		const { req, res } = createMocks({
			method: 'GET',
			headers: {
				Authorization: 'basic admin:guest',
			},
		});

		await m.auth(defaultHandler)(req, res);

		expect(res._getStatusCode()).toBe(200);
		expect(res._getData()).toBe('OK');
	});

	test('works as expected when unauthorized', async () => {
		const { req, res } = createMocks({
			method: 'GET',
		});

		await m.auth(defaultHandler)(req, res);

		expect(res._getStatusCode()).toBe(UNAUTHORIZED_CODE);
		expect(res._getData()).toBe(UNAUTHORIZED_TEXT);
	});

	test('works as expected when providing wrong credentials', async () => {
		const { req, res } = createMocks({
			method: 'GET',
			headers: {
				Authorization: 'basic admin:disturbinglyStrongPassword',
			},
		});

		await m.auth(defaultHandler)(req, res);

		expect(res._getStatusCode()).toBe(UNAUTHORIZED_CODE);
		expect(res._getData()).toBe(UNAUTHORIZED_TEXT);
	});

	test('works as expected when unauthorized but anonymous access is allowed', async () => {
		const { req, res } = createMocks({
			method: 'GET',
		});

		await m.auth(defaultHandler, { allowAnonymous: true })(req, res);

		expect(res._getStatusCode()).toBe(200);
		expect(res._getData()).toBe('OK');
	});
});
