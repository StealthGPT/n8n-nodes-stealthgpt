# n8n-nodes-stealthgpt

This is an n8n community node. It lets you use [StealthGPT](https://www.stealthgpt.ai) in your n8n workflows.

StealthGPT turns prompts and existing drafts into **natural, human, publish-ready long-form content** via API. Use the full content pipeline (research → draft → optional fact-check → humanize → optional citations/images → final markdown) or just the humanization step on text you already have. The output is designed to read as natural and human, and to hold up against AI-content detectors and editorial quality filters.

[n8n](https://n8n.io) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)
[Operations](#operations)
[Credentials](#credentials)
[How it works (async runs)](#how-it-works-async-runs)
[Example workflows](#example-workflows)
[Billing & credits](#billing--credits)
[Resources](#resources)
[Support](#support)
[License](#license)
[Changelog](#changelog)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

In n8n: go to **Settings → Community Nodes → Install**, enter `n8n-nodes-stealthgpt`, and confirm.

## Operations

The node exposes two resources, each with a **Start Run** and a **Get Run Status** operation.

### Content Generation

Runs the full StealthGPT content pipeline.

**Start Run** fields:

- **Preset** — `Academic`, `SEO`, or `Social`.
- **Prompt** — the topic or brief to generate from (required).
- **Platform** — `LinkedIn` or `Medium` (shown only for the `Social` preset).
- **Enable Fact Check** — run an additional fact-checking step (default off).
- **Enable Image Generation** — generate images for the content (default off).
- **Wait for Completion** — poll until the run finishes and return the result (default on).
- **Poll Interval (Seconds)** / **Max Wait (Seconds)** — control polling when waiting (defaults 5s / 600s).
- **Options** — `Idempotency Key`, `Webhook URL`, `Webhook Secret`.

**Get Run Status** fields:

- **Run ID** — the ID returned when the run was started (content generation run IDs are prefixed with `run_`).

### Text Humanization

Transforms existing text into natural, human-quality writing.

**Start Run** fields:

- **Text** — the text to humanize (required).
- **Quality Mode** — `Quality` or `Fast` (default `Quality`).
- **Model** — `Heavy` or `Lite` (default `Heavy`).
- **Output Format** — `Text` or `Markdown` (default `Text`).
- **Wait for Completion** — poll until the run finishes and return the result (default on).
- **Poll Interval (Seconds)** / **Max Wait (Seconds)** — control polling when waiting (defaults 5s / 600s).
- **Options** — `Idempotency Key`, `Webhook URL`, `Webhook Secret`.

**Get Run Status** fields:

- **Run ID** — the ID returned when the run was started.

The completed humanization payload includes `howLikelyToBeDetected`, a human-likeness score from 0–100 where **higher means more human**.

## Credentials

You need a StealthGPT API key.

1. Create an account at [stealthgpt.ai](https://www.stealthgpt.ai).
2. Get your API key from [https://www.stealthgpt.ai/stealthapi](https://www.stealthgpt.ai/stealthapi).
3. In n8n, create a **StealthGPT API** credential and paste the key into **API Token**.
4. Leave **Base URL** as `https://www.stealthgpt.ai` unless instructed otherwise.

The credential is authenticated with the `api-token` header and tested against the balance endpoint. Your key stays in your n8n instance.

## How it works (async runs)

StealthGPT runs are **asynchronous**. Starting a run returns a `runId` immediately; a full pipeline run can take several minutes.

- **Wait for Completion = on** (default): the node starts the run and polls the status endpoint every *Poll Interval* seconds, up to *Max Wait* seconds, then returns the terminal payload. If the run ends as `failed` or `cancelled`, the node throws an error with the API's message. If it doesn't finish in time, the node throws a timeout error that includes the `runId` so you can fetch the result later.
- **Wait for Completion = off**: the node returns `{ runId, status, statusUrl }` immediately. Wire your own polling (a **Wait** node + **Get Run Status**) or use a webhook to continue when the run finishes.

Use the **Options → Idempotency Key** to make start calls safe to retry without creating duplicate runs or charges. You can optionally provide **Webhook URL** / **Webhook Secret** to have StealthGPT call back on completion; see the API docs for the signature scheme.

## Example workflows

### RSS → SEO article → WordPress draft

1. **RSS Read** trigger.
2. **StealthGPT** → Content Generation → Start Run, Preset `SEO`, Prompt built from the feed item, Wait for Completion on.
3. **WordPress** → create a draft post from `result` (markdown).

### Webhook → Humanize → Google Docs

1. **Webhook** trigger receiving the source text.
2. **StealthGPT** → Text Humanization → Start Run, Output Format `Markdown`, Wait for Completion on.
3. **Google Docs** → insert `result`.

### Long-running run with manual polling

1. **StealthGPT** → Start Run with Wait for Completion **off** → returns `runId`.
2. **Wait** node (e.g. 30s).
3. **StealthGPT** → Get Run Status with the `runId`.
4. **IF** `status` is `completed` → continue; otherwise loop back to the Wait node.

## Billing & credits

Runs consume StealthGPT credits. Completed runs return billing metadata such as `creditsSpent`, `remainingCredits`, and `billingMode`. Using an **Idempotency Key** prevents duplicate charges on safe retries. Failed and cancelled runs behave predictably per the API contract. Manage credits and billing at [stealthgpt.ai](https://www.stealthgpt.ai).

## Resources

- [StealthGPT API documentation](https://docs.stealthgpt.ai)
- [Get an API key](https://www.stealthgpt.ai/stealthapi)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)

## Support

- Issues: [github.com/StealthGPT/n8n-nodes-stealthgpt/issues](https://github.com/StealthGPT/n8n-nodes-stealthgpt/issues)
- Email: [support@stealthgpt.ai](mailto:support@stealthgpt.ai)

## License

[MIT](LICENSE)

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

### Compatibility

Requires n8n with Node.js 20.15 or newer. Built and tested against the n8n nodes API version 1.
