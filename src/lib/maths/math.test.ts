jest.mock('./math');

import * as addsub from './addsub';
import {add, sub} from './math';

async function sleep(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

test('adds 1 + 2 to equal 3', async () => {
	await sleep(10);
	await addsub.add(1, 1);
	expect(add).toBeCalledWith(1, 1);
});

test('subtract 2 - 1 to equal 1', async () => {
	await sleep(10);
	await addsub.sub(2, 1);
	expect(sub).toBeCalledWith(2, 1);
});
