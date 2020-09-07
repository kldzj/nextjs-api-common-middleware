import { createMocks } from 'node-mocks-http';
import { createExport } from '../../src';
import { defaultHandler } from '../setup';

const AUTH_HEADER_PREFIX = 'Custom';
const AUTH_HEADER_VALUE = 'secure_value could even contain spaces';
const AUTH_HEADER = `${AUTH_HEADER_PREFIX} ${AUTH_HEADER_VALUE}`;
const UNAUTHORIZED_CODE = 401;
const UNAUTHORIZED_TEXT = 'UNAUTHORIZED';

describe('auth (strategy:custom) middleware', () => {
	const m = createExport({
		auth: {
			strategy: 'custom',
			headerPrefix: AUTH_HEADER_PREFIX,
			custom: (authHeader, _req) => {
				if (authHeader === AUTH_HEADER_VALUE) return { uid: 2, user: { name: 'test' } };
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
				Authorization: AUTH_HEADER,
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
				Authorization: AUTH_HEADER + ', and this makes it invalid',
			},
		});

		await m.auth(defaultHandler)(req, res);

		expect(res._getStatusCode()).toBe(UNAUTHORIZED_CODE);
		expect(res._getData()).toBe(UNAUTHORIZED_TEXT);
	});

	test('works as expected when header is being trimmed', async () => {
		const { req, res } = createMocks({
			method: 'GET',
			headers: {
				Authorization: '  ' + AUTH_HEADER + '  ',
			},
		});

		await m.auth(defaultHandler, { trimHeaderValue: true })(req, res);

		expect(res._getStatusCode()).toBe(200);
		expect(res._getData()).toBe('OK');
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
