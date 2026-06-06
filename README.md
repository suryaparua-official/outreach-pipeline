# Outreach Pipeline

One domain in. Personalized cold outreach out. Zero manual steps in between.

## Overview

This repository contains a TypeScript cold outreach pipeline that runs four provider-specific stages in sequence. The pipeline is designed for deterministic execution, explicit safety review, and integration with Ocean.io, Prospeo, Eazyreach, and Brevo.

The implementation separates stage logic from orchestration and utility code, making the pipeline easier to extend and maintain.

## How it works

```bash
npm start vocallabs.ai
```

Simple flow:

vocallabs.ai → Ocean.io (10 lookalike companies) → Prospeo (C-suite + LinkedIn URLs) → Eazyreach (verified emails) → Safety Checkpoint (review before send) → Brevo (personalized emails sent)

## Features

- Four-stage outreach pipeline with explicit handoff between providers
- Safety checkpoint before any email dispatch
- Environment-driven credential management
- Docker-compatible execution for local or containerized deployment

## Architecture

<img width="1520" height="889" alt="outreach_pipeline_architecture" src="https://github.com/user-attachments/assets/f83b42e5-282d-47da-b795-d51853b45f35" />

The pipeline runs four stages sequentially:

- Stage 1 — Ocean.io finds lookalike companies from the seed domain
- Stage 2 — Prospeo surfaces C-suite and VP level decision makers with LinkedIn URLs
- Stage 3 — Eazyreach resolves each LinkedIn profile into a verified work email
- Stage 4 — Brevo sends a personalized outreach email to every verified contact

A safety checkpoint between Stage 3 and Stage 4 shows all contacts and requires explicit confirmation before any email is sent.

## Getting Started

### Prerequisites

- Node.js 20 or later
- npm
- Docker (optional)

### Install dependencies

```bash
npm install
```

### Environment configuration

Copy the sample environment file and populate the required API credentials:

```bash
cp .env.example .env
```

Required environment variables:

| Variable                  | Description                                      |
| ------------------------- | ------------------------------------------------ |
| `OCEAN_API_KEY`           | Ocean.io API key for company discovery           |
| `PROSPEO_API_KEY`         | Prospeo API key for executive contact enrichment |
| `EAZYREACH_CLIENT_ID`     | Eazyreach client identifier for email resolution |
| `EAZYREACH_CLIENT_SECRET` | Eazyreach client secret for email resolution     |
| `BREVO_API_KEY`           | Brevo API key for outbound email delivery        |
| `SENDER_EMAIL`            | Verified sender email address used by Brevo      |

### Local development

Run the application directly with:

```bash
npm run dev
```

### Build

Compile TypeScript to JavaScript:

```bash
npm run build
```

### Docker

Build the Docker image and run the container:

```bash
docker build -t outreach-pipeline .
docker run -it --env-file .env outreach-pipeline npm start vocallabs.ai
```

Or use Docker Compose:

```bash
docker compose up --build
```

## Safety Checkpoint

Before any email fires, the pipeline prints every contact and asks for confirmation:

```
## ==================================================
SAFETY CHECKPOINT — Review before sending

1. John Smith (CEO)
[john@stripe.com](mailto:john@stripe.com) — stripe.com

Send emails? (yes/no):
```

Type `yes` to send. Anything else exits with zero emails sent.

## Project Structure

- `src/index.ts` — orchestrates all 4 stages sequentially
- `src/types.ts` — TypeScript interfaces: Company, DecisionMaker, Contact
- `src/stages/ocean.ts` — Stage 1: finds lookalike companies
- `src/stages/prospeo.ts` — Stage 2: finds decision makers
- `src/stages/eazyreach.ts` — Stage 3: resolves verified emails
- `src/stages/brevo.ts` — Stage 4: sends outreach emails
- `src/utils/checkpoint.ts` — safety confirmation before send
- `src/utils/logger.ts` — colored terminal output

## Notes

Keep secrets out of source control by using `.env` and verifying that `.gitignore` includes local configuration files. The current implementation is focused on pipeline orchestration; provider-specific business logic can be expanded in stage modules.

Author: Surya Parua
