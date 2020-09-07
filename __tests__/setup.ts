import { NextApiResponse } from 'next';
import { PossiblyAuthedNextApiRequest } from '../src/types';

export async function defaultHandler(req: PossiblyAuthedNextApiRequest, res: NextApiResponse) {
	res.status(200).send('OK');
}

export async function throwingHandler(req: PossiblyAuthedNextApiRequest, res: NextApiResponse) {
	throw new Error('Some error occurred');
}
