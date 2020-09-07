import jwt from 'jsonwebtoken';
import { createMocks } from 'node-mocks-http';
import { createExport } from '../../src';
import { defaultHandler } from '../setup';

const JWT_SECRET = 'test';
const TOKEN = jwt.sign({ uid: 1 }, JWT_SECRET);
const UNAUTHORIZED_CODE = 401;
const UNAUTHORIZED_TEXT = 'UNAUTHORIZED';

describe('auth (strategy:bearer) middleware', () => {
	const m = createExport({
		auth: {
			strategy: 'bearer',
			secret: JWT_SECRET,
			uidKey: 'uid',
			getUser(userId) {
				if (userId === 1) return { uid: 1, user: { name: 'test' } };
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
				Authorization: `bearer ${TOKEN}`,
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
				Authorization: `bearer ${jwt.sign({ uid: 2 }, 'test2')}`,
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

	test('works as expected when custom decodeToken method is provided', async () => {
		const mm = createExport({
			auth: {
				strategy: 'bearer',
				decodeToken: (token) => {
					try {
						const { uid } = jwt.verify(token, JWT_SECRET) as any;
						return uid;
					} catch (_error) {
						return null;
					}
				},
				getUser: (userId) => {
					if (userId === 1) return { uid: 1, user: { name: 'test' } };
					return null;
				},
			},
		});
	});
});
