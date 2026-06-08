import type {
	IAuthenticateGeneric,
	Icon,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class StealthGptApi implements ICredentialType {
	name = 'stealthGptApi';

	displayName = 'StealthGPT API';

	icon: Icon = 'file:../icons/stealthgpt.svg';

	documentationUrl = 'https://docs.stealthgpt.ai';

	properties: INodeProperties[] = [
		{
			displayName: 'API Token',
			name: 'apiToken',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Your StealthGPT API key. Get one at https://www.stealthgpt.ai/stealthapi.',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://www.stealthgpt.ai',
			description: 'Base URL of the StealthGPT API. Only change this if instructed to.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'api-token': '={{$credentials.apiToken}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/api/stealthify/balance',
			method: 'GET',
		},
	};
}
