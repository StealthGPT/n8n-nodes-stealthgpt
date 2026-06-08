import type {
	IDataObject,
	IExecuteFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeOperationError, sleep } from 'n8n-workflow';

import type { RunStatusResponse } from './types';
import { TERMINAL_STATUSES } from './types';

const DEFAULT_BASE_URL = 'https://www.stealthgpt.ai';

function getApiMessage(error: JsonObject): string | undefined {
	const candidates = [
		(error as IDataObject)?.response,
		((error as IDataObject)?.cause as IDataObject)?.response,
	];
	for (const response of candidates) {
		const body = (response as IDataObject)?.body ?? (response as IDataObject)?.data;
		const message = (body as IDataObject)?.message;
		if (typeof message === 'string' && message.length > 0) {
			return message;
		}
	}
	return undefined;
}

function mapError(this: IExecuteFunctions, error: JsonObject): NodeApiError {
	const httpCode = (error as IDataObject)?.httpCode as string | undefined;
	const apiMessage = getApiMessage(error);

	if (httpCode === '401') {
		return new NodeApiError(this.getNode(), error, {
			message: 'Invalid or missing StealthGPT API token',
			description: 'Check the API Token in your StealthGPT credential and try again.',
		});
	}

	if (httpCode === '402') {
		return new NodeApiError(this.getNode(), error, {
			message: apiMessage ?? 'StealthGPT billing problem',
			description:
				'Your StealthGPT account has a billing issue. Add credits or review your plan at https://www.stealthgpt.ai.',
		});
	}

	if (httpCode === '429') {
		return new NodeApiError(this.getNode(), error, {
			message: 'StealthGPT rate limit reached',
			description: 'This is a transient error. Enable "Retry On Fail" or try again shortly.',
		});
	}

	if (httpCode === '400') {
		return new NodeApiError(this.getNode(), error, {
			message: apiMessage ?? 'Invalid request sent to StealthGPT',
			description: 'Check the operation fields and try again.',
		});
	}

	if (apiMessage !== undefined) {
		return new NodeApiError(this.getNode(), error, { message: apiMessage });
	}

	return new NodeApiError(this.getNode(), error);
}

export async function stealthGptApiRequest(
	this: IExecuteFunctions,
	method: IHttpRequestMethods,
	path: string,
	body?: IDataObject,
	extraHeaders?: IDataObject,
): Promise<IDataObject> {
	const credentials = await this.getCredentials('stealthGptApi');
	const baseUrl = ((credentials.baseUrl as string) || DEFAULT_BASE_URL).replace(/\/+$/, '');

	const options: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${path}`,
		json: true,
		headers: {
			'Content-Type': 'application/json',
			...(extraHeaders ?? {}),
		},
	};

	if (body !== undefined) {
		options.body = body;
	}

	try {
		return (await this.helpers.httpRequestWithAuthentication.call(
			this,
			'stealthGptApi',
			options,
		)) as IDataObject;
	} catch (error) {
		throw mapError.call(this, error as JsonObject);
	}
}

export async function pollRun(
	this: IExecuteFunctions,
	statusPath: string,
	pollIntervalSeconds: number,
	maxWaitSeconds: number,
	itemIndex: number,
): Promise<RunStatusResponse> {
	const intervalMs = Math.max(1, pollIntervalSeconds) * 1000;
	const deadline = Date.now() + Math.max(1, maxWaitSeconds) * 1000;

	let lastResponse: RunStatusResponse | undefined;

	do {
		lastResponse = (await stealthGptApiRequest.call(this, 'GET', statusPath)) as RunStatusResponse;

		if (TERMINAL_STATUSES.includes(lastResponse.status)) {
			return lastResponse;
		}

		if (Date.now() + intervalMs >= deadline) {
			break;
		}

		await sleep(intervalMs);
	} while (Date.now() < deadline);

	throw new NodeOperationError(
		this.getNode(),
		`StealthGPT run did not finish within ${maxWaitSeconds}s`,
		{
			itemIndex,
			description: `The run is still "${lastResponse?.status ?? 'pending'}". It may still complete — use the "Get Run Status" operation with run ID "${lastResponse?.runId ?? ''}" to retrieve the result later, or increase "Max Wait (Seconds)".`,
		},
	);
}
