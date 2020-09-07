import { NextApiResponse } from 'next';
import { createMocks } from 'node-mocks-http';
import { chain, createExport, auth, guard, PossiblyAuthedNextApiRequest } from '../src';
import { defaultHandler, throwingHandler } from './setup';

describe('export', () => {
	test('chain executes as expected', async () => {
		const { req, res } = createMocks({
			method: 'GET',
			query: { foo: 'bar' },
			headers: {
				authorization: 'basic test:test',
			},
		});

		await chain([auth, guard], defaultHandler, {
			auth: {
				strategy: 'basic',
				basic: () => ({ uid: 1, user: { name: 'test' } }),
			},
			guard: {
				mustBe: 'GET',
				required: ['foo'],
			},
		})(req, res);

		expect(res._getStatusCode()).toBe(200);
		expect(res._getData()).toBe('OK');
	});

	test('non-static chain options get merged with existing options', async () => {
		const m = createExport({
			auth: {
				strategy: 'basic',
				basic: () => ({ uid: 1, user: { name: 'test' } }),
			},
		});

		const { req, res } = createMocks({
			method: 'GET',
			query: { foo: 'bar' },
			headers: {
				authorization: 'basic test:test',
			},
		});

		await m._.chain([m.auth, m.guard], defaultHandler, {
			guard: {
				mustBe: 'GET',
				required: ['foo'],
			},
		})(req, res);

		expect(res._getStatusCode()).toBe(200);
		expect(res._getData()).toBe('OK');
	});

	test('chain executes as expected when middleware stops flow', async () => {
		const { req, res } = createMocks({
			method: 'GET',
			headers: {
				authorization: 'basic test:test',
			},
		});

		await chain([auth, guard], defaultHandler, {
			auth: {
				strategy: 'basic',
				basic: () => ({ uid: 1, user: { name: 'test' } }),
			},
			guard: {
				mustBe: 'POST',
				required: ['foo'],
			},
		})(req, res);

		expect(res._getStatusCode()).toBe(400);
	});
});
