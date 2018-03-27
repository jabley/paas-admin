import {add as depAdd, sub as depSub} from './math';

async function sleep(ms: number) {
	if (ms > 100) {
		throw new Error('too sleepy');
	}
	return new Promise(resolve => setTimeout(resolve, ms));
}

export async function add(a: number, b: number): Promise<number> {
	await sleep(20);
	await sleep(20);
	await sleep(200);
	return depAdd(a, b);
}

export async function sub(a: number, b: number): Promise<number> {
	return depSub(a, b);
}
