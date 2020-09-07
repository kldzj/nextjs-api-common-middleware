import { createMocks } from 'node-mocks-http';
import m from '../../src';
import { defaultHandler } from '../setup';

const ORIGIN = 'http://localhost:3000';

describe('cors middleware', () => {
	test('works as expected', async () => {
		const { req, res } = createMocks({
			method: 'GET',
		});

		await m.cors(defaultHandler, {
			origin: ORIGIN,
			allowCredentials: true,
			allowedHeaders: ['Content-Type'],
			allowedMethods: ['GET'],
			maxAge: 88600,
		})(req, res);

		expect(res._getStatusCode()).toBe(200);
		expect(res.getHeader('Access-Control-Allow-Origin')).toBe(ORIGIN);
		expect(res.getHeader('Access-Control-Allow-Credentials')).toBe('true');
		expect(res.getHeader('Access-Control-Allow-Headers')).toBe('Content-Type');
		expect(res.getHeader('Access-Control-Allow-Methods')).toBe('GET');
		expect(res.getHeader('Access-Control-Max-Age')).toBe('88600');
	});

	test('works as expected with origin string[]', async () => {
		const { req, res } = createMocks({
			method: 'GET',
		});

		const origins = ['http://localhost:3000', 'http://localhost:3001'];

		await m.cors(defaultHandler, {
			origin: origins,
		})(req, res);

		expect(res._getStatusCode()).toBe(200);
		expect(res.getHeader('Access-Control-Allow-Origin')).toBe(origins.join(','));
	});

	test('works as expected with origin regex', async () => {
		const { req, res } = createMocks({
			method: 'GET',
			headers: {
				origin: ORIGIN,
			},
		});

		await m.cors(defaultHandler, {
			origin: /http:\/\/localhost:\d{4}/i,
		})(req, res);

		expect(res._getStatusCode()).toBe(200);
		expect(res.getHeader('Access-Control-Allow-Origin')).toBe(ORIGIN);
	});

	test('works as expected with origin function', async () => {
		const { req, res } = createMocks({
			method: 'GET',
			originalUrl: ORIGIN,
		});

		await m.cors(defaultHandler, {
			origin: (_req) => [ORIGIN],
		})(req, res);

		expect(res._getStatusCode()).toBe(200);
		expect(res.getHeader('Access-Control-Allow-Origin')).toBe(ORIGIN);
	});
});
