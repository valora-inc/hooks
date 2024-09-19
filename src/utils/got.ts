import got, { ExtendOptions } from 'got';

const options: ExtendOptions = {
	timeout: {
		request: 10 * 1000,
	}
};

const client = got.extend(options);

export default client;