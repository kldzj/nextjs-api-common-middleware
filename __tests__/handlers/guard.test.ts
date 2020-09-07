import { createMocks } from 'node-mocks-http';
import { guard } from '../../src';
import { defaultHandler } from '../setup';

describe('guard middleware', () => {
	test('works as expected if all constraints are satisfied (simple)', async () => {
		const { req, res } = createMocks({
			method: 'GET',
			query: { foo: 'bar' },
		});

		await guard(defaultHandler, {
			mustBe: 'GET',
			required: ['foo'],
		})(req, res);

		expect(res._getStatusCode()).toBe(200);
		expect(res._getData()).toBe('OK');
	});

	test('works as expected if all constraints are satisfied (extended)', async () => {
		const { req, res } = createMocks({
			method: 'GET',
			query: { foo: 'bar' },
		});

		await guard(defaultHandler, {
			mustBe: {
				method: 'GET',
			},
			required: {
				fields: ['foo'],
			},
		})(req, res);

		expect(res._getStatusCode()).toBe(200);
		expect(res._getData()).toBe('OK');
	});

	test('works as expected if only some constraints are satisfied (missing fields)', async () => {
		const { req, res } = createMocks({
			method: 'GET',
			query: { foo: 'bar' },
		});

		await guard(defaultHandler, {
			mustBe: {
				method: 'GET',
				httpStatus: 400,
			},
			required: {
				fields: ['foo', 'test'],
			},
		})(req, res);

		expect(res._getStatusCode()).toBe(400);
	});

	test('works as expected if only some constraints are satisfied (wrong http method)', async () => {
		const { req, res } = createMocks({
			method: 'POST',
			query: { foo: 'bar' },
		});

		await guard(defaultHandler, {
			mustBe: {
				method: 'GET',
				httpStatus: 400,
			},
			required: {
				fields: ['foo', 'test'],
			},
		})(req, res);

		expect(res._getStatusCode()).toBe(400);
	});
});
