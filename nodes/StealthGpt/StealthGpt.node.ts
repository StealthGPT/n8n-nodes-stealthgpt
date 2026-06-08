import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';

import {
	contentGenerationFields,
	contentGenerationOperations,
} from './descriptions/contentGeneration';
import {
	textHumanizationFields,
	textHumanizationOperations,
} from './descriptions/textHumanization';
import { pollRun, stealthGptApiRequest } from './shared/transport';
import type { RunStatusResponse } from './shared/types';

const AGENT_RUNS_PATH = '/api/stealthify/agent/runs';
const HUMANIZE_RUNS_PATH = '/api/stealthify/runs';

function buildWebhookFields(options: IDataObject, body: IDataObject): void {
	if (typeof options.webhookUrl === 'string' && options.webhookUrl.length > 0) {
		body.webhookUrl = options.webhookUrl;
	}
	if (typeof options.webhookSecret === 'string' && options.webhookSecret.length > 0) {
		body.webhookSecret = options.webhookSecret;
	}
}

function buildIdempotencyHeader(options: IDataObject): IDataObject | undefined {
	if (typeof options.idempotencyKey === 'string' && options.idempotencyKey.length > 0) {
		return { 'idempotency-key': options.idempotencyKey };
	}
	return undefined;
}

export class StealthGpt implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'StealthGPT',
		name: 'stealthGpt',
		icon: 'file:../../icons/stealthgpt.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description:
			'Generate natural, human, publish-ready long-form content or humanize existing text with StealthGPT',
		defaults: {
			name: 'StealthGPT',
		},
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'stealthGptApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Content Generation',
						value: 'contentGeneration',
						description: 'Run the full content pipeline (research, draft, humanize and more)',
					},
					{
						name: 'Text Humanization',
						value: 'textHumanization',
						description: 'Humanize existing text into natural, publish-ready writing',
					},
				],
				default: 'contentGeneration',
			},
			...contentGenerationOperations,
			...contentGenerationFields,
			...textHumanizationOperations,
			...textHumanizationFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: IDataObject;

				if (resource === 'contentGeneration') {
					responseData = await handleContentGeneration.call(this, operation, i);
				} else if (resource === 'textHumanization') {
					responseData = await handleTextHumanization.call(this, operation, i);
				} else {
					throw new NodeOperationError(this.getNode(), `Unknown resource "${resource}"`, {
						itemIndex: i,
					});
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					const executionData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ error: (error as Error).message }),
						{ itemData: { item: i } },
					);
					returnData.push(...executionData);
					continue;
				}
				const nodeError =
					error instanceof NodeApiError || error instanceof NodeOperationError
						? error
						: new NodeApiError(this.getNode(), error as JsonObject, { itemIndex: i });
				throw nodeError;
			}
		}

		return [returnData];
	}
}

async function handleContentGeneration(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject> {
	if (operation === 'getRunStatus') {
		const runId = (this.getNodeParameter('runId', itemIndex) as string).trim();
		if (runId.length === 0) {
			throw new NodeOperationError(this.getNode(), 'Run ID is required', { itemIndex });
		}
		return stealthGptApiRequest.call(
			this,
			'GET',
			`${AGENT_RUNS_PATH}/${encodeURIComponent(runId)}`,
		);
	}

	const preset = this.getNodeParameter('preset', itemIndex) as string;
	const prompt = (this.getNodeParameter('prompt', itemIndex) as string).trim();
	if (prompt.length === 0) {
		throw new NodeOperationError(this.getNode(), 'Prompt is required', { itemIndex });
	}

	const body: IDataObject = {
		preset,
		prompt,
		enableFactCheck: this.getNodeParameter('enableFactCheck', itemIndex) as boolean,
		enableImageGeneration: this.getNodeParameter('enableImageGeneration', itemIndex) as boolean,
	};

	if (preset === 'social') {
		body.platform = this.getNodeParameter('platform', itemIndex) as string;
	}

	const options = this.getNodeParameter('options', itemIndex, {}) as IDataObject;
	buildWebhookFields(options, body);

	const created = (await stealthGptApiRequest.call(
		this,
		'POST',
		AGENT_RUNS_PATH,
		body,
		buildIdempotencyHeader(options),
	)) as IDataObject & { runId: string };

	const waitForCompletion = this.getNodeParameter('waitForCompletion', itemIndex) as boolean;
	if (!waitForCompletion) {
		return created;
	}

	const terminal = await waitAndValidate.call(
		this,
		`${AGENT_RUNS_PATH}/${encodeURIComponent(created.runId)}`,
		itemIndex,
	);
	return terminal;
}

async function handleTextHumanization(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject> {
	if (operation === 'getRunStatus') {
		const runId = (this.getNodeParameter('runId', itemIndex) as string).trim();
		if (runId.length === 0) {
			throw new NodeOperationError(this.getNode(), 'Run ID is required', { itemIndex });
		}
		return stealthGptApiRequest.call(
			this,
			'GET',
			`${HUMANIZE_RUNS_PATH}/${encodeURIComponent(runId)}`,
		);
	}

	const text = this.getNodeParameter('text', itemIndex) as string;
	if (text.trim().length === 0) {
		throw new NodeOperationError(this.getNode(), 'Text is required', { itemIndex });
	}

	const body: IDataObject = {
		text,
		qualityMode: this.getNodeParameter('qualityMode', itemIndex) as string,
		model: this.getNodeParameter('model', itemIndex) as string,
		outputFormat: this.getNodeParameter('outputFormat', itemIndex) as string,
	};

	const options = this.getNodeParameter('options', itemIndex, {}) as IDataObject;
	buildWebhookFields(options, body);

	const created = (await stealthGptApiRequest.call(
		this,
		'POST',
		HUMANIZE_RUNS_PATH,
		body,
		buildIdempotencyHeader(options),
	)) as IDataObject & { runId: string };

	const waitForCompletion = this.getNodeParameter('waitForCompletion', itemIndex) as boolean;
	if (!waitForCompletion) {
		return created;
	}

	const terminal = await waitAndValidate.call(
		this,
		`${HUMANIZE_RUNS_PATH}/${encodeURIComponent(created.runId)}`,
		itemIndex,
	);
	return terminal;
}

async function waitAndValidate(
	this: IExecuteFunctions,
	statusPath: string,
	itemIndex: number,
): Promise<RunStatusResponse> {
	const pollIntervalSeconds = this.getNodeParameter('pollIntervalSeconds', itemIndex) as number;
	const maxWaitSeconds = this.getNodeParameter('maxWaitSeconds', itemIndex) as number;

	const terminal = await pollRun.call(
		this,
		statusPath,
		pollIntervalSeconds,
		maxWaitSeconds,
		itemIndex,
	);

	if (terminal.status === 'failed' || terminal.status === 'cancelled') {
		throw new NodeApiError(this.getNode(), terminal as unknown as JsonObject, {
			message: terminal.error?.message ?? `StealthGPT run ${terminal.status}`,
			description: terminal.error?.code ? `Error code: ${terminal.error.code}` : undefined,
		});
	}

	return terminal;
}
