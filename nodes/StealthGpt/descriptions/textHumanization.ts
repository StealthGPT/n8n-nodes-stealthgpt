import type { INodeProperties } from 'n8n-workflow';

const showForResource = {
	resource: ['textHumanization'],
};

export const textHumanizationOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: showForResource },
		options: [
			{
				name: 'Start Run',
				value: 'start',
				action: 'Start a text humanization run',
				description: 'Turn existing text into natural, human, publish-ready text',
			},
			{
				name: 'Get Run Status',
				value: 'getRunStatus',
				action: 'Get a text humanization run status',
				description: 'Retrieve the status and result of a humanization run',
			},
		],
		default: 'start',
	},
];

export const textHumanizationFields: INodeProperties[] = [
	{
		displayName: 'Text',
		name: 'text',
		type: 'string',
		typeOptions: { rows: 5 },
		required: true,
		default: '',
		placeholder: 'Paste the text to humanize ...',
		displayOptions: { show: { ...showForResource, operation: ['start'] } },
		description: 'The text to transform into natural, human-quality writing',
	},
	{
		displayName: 'Quality Mode',
		name: 'qualityMode',
		type: 'options',
		options: [
			{ name: 'Quality', value: 'quality' },
			{ name: 'Fast', value: 'fast' },
		],
		default: 'quality',
		displayOptions: { show: { ...showForResource, operation: ['start'] } },
		description: 'Trade off between output quality and speed',
	},
	{
		displayName: 'Model',
		name: 'model',
		type: 'options',
		options: [
			{ name: 'Heavy', value: 'heavy' },
			{ name: 'Lite', value: 'lite' },
		],
		default: 'heavy',
		displayOptions: { show: { ...showForResource, operation: ['start'] } },
		description: 'Which humanization model to use',
	},
	{
		displayName: 'Output Format',
		name: 'outputFormat',
		type: 'options',
		options: [
			{ name: 'Text', value: 'text' },
			{ name: 'Markdown', value: 'markdown' },
		],
		default: 'text',
		displayOptions: { show: { ...showForResource, operation: ['start'] } },
		description: 'Format of the returned result',
	},
	{
		displayName: 'Wait for Completion',
		name: 'waitForCompletion',
		type: 'boolean',
		default: true,
		displayOptions: { show: { ...showForResource, operation: ['start'] } },
		description:
			'Whether to poll until the run finishes and return the result. Turn off to return the run ID immediately and poll later with "Get Run Status".',
	},
	{
		displayName: 'Poll Interval (Seconds)',
		name: 'pollIntervalSeconds',
		type: 'number',
		typeOptions: { minValue: 1 },
		default: 5,
		displayOptions: {
			show: { ...showForResource, operation: ['start'], waitForCompletion: [true] },
		},
		description: 'How often to check the run status while waiting',
	},
	{
		displayName: 'Max Wait (Seconds)',
		name: 'maxWaitSeconds',
		type: 'number',
		typeOptions: { minValue: 1 },
		default: 600,
		displayOptions: {
			show: { ...showForResource, operation: ['start'], waitForCompletion: [true] },
		},
		description: 'Maximum time to wait for the run to finish before timing out',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { ...showForResource, operation: ['start'] } },
		options: [
			{
				displayName: 'Idempotency Key',
				name: 'idempotencyKey',
				type: 'string',
				default: '',
				description:
					'Unique key (1-255 chars) to safely retry the create call without duplicate runs or charges',
			},
			{
				displayName: 'Webhook URL',
				name: 'webhookUrl',
				type: 'string',
				default: '',
				description: 'URL that StealthGPT calls with the terminal result or failure',
			},
			{
				displayName: 'Webhook Secret',
				name: 'webhookSecret',
				type: 'string',
				typeOptions: { password: true },
				default: '',
				description: 'Secret (16-255 chars) used to sign the webhook payload',
			},
		],
	},
	{
		displayName: 'Run ID',
		name: 'runId',
		type: 'string',
		required: true,
		default: '',
		displayOptions: { show: { ...showForResource, operation: ['getRunStatus'] } },
		description: 'The ID returned when the run was started',
	},
];
