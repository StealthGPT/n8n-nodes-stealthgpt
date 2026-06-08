import type { IDataObject } from 'n8n-workflow';

export type RunStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface RunCreateResponse extends IDataObject {
	runId: string;
	status: 'queued';
	statusUrl: string;
}

export interface RunStatusResponse extends IDataObject {
	runId: string;
	status: RunStatus;
	error?: {
		code: string;
		message: string;
	};
}

export const TERMINAL_STATUSES: RunStatus[] = ['completed', 'failed', 'cancelled'];
