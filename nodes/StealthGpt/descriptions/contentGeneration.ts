import type { INodeProperties } from 'n8n-workflow';

const showForResource = {
	resource: ['contentGeneration'],
};

export const contentGenerationOperations: INodeProperties[] = [
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
				action: 'Start a content generation run',
				description: 'Start a full content pipeline run (research, draft, humanize and more)',
			},
			{
				name: 'Get Run Status',
				value: 'getRunStatus',
				action: 'Get a content generation run status',
				description: 'Retrieve the status and result of a content generation run',
			},
		],
		default: 'start',
	},
];

export const contentGenerationFields: INodeProperties[] = [
	{
		displayName: 'Preset',
		name: 'preset',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { ...showForResource, operation: ['start'] } },
		options: [
			{ name: 'Academic', value: 'academic' },
			{ name: 'SEO', value: 'seo' },
			{ name: 'Social', value: 'social' },
		],
		default: 'seo',
		description: 'Which content pipeline to run',
	},
	{
		displayName: 'Prompt',
		name: 'prompt',
		type: 'string',
		typeOptions: { rows: 4 },
		required: true,
		default: '',
		placeholder: 'Write a long-form article about ...',
		displayOptions: { show: { ...showForResource, operation: ['start'] } },
		description: 'The topic or brief to generate content from',
	},
	{
		displayName: 'Platform',
		name: 'platform',
		type: 'options',
		displayOptions: {
			show: { ...showForResource, operation: ['start'], preset: ['social'] },
		},
		options: [
			{ name: 'LinkedIn', value: 'linkedin' },
			{ name: 'Medium', value: 'medium' },
		],
		default: 'linkedin',
		description: 'Target platform for the social preset',
	},
	{
		displayName: 'Enable Fact Check',
		name: 'enableFactCheck',
		type: 'boolean',
		default: false,
		displayOptions: { show: { ...showForResource, operation: ['start'] } },
		description: 'Whether to run an additional fact-checking step',
	},
	{
		displayName: 'Enable Image Generation',
		name: 'enableImageGeneration',
		type: 'boolean',
		default: false,
		displayOptions: { show: { ...showForResource, operation: ['start'] } },
		description: 'Whether to generate images for the content',
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
		placeholder: 'run_...',
		displayOptions: { show: { ...showForResource, operation: ['getRunStatus'] } },
		description: 'The ID returned when the run was started',
	},
];
