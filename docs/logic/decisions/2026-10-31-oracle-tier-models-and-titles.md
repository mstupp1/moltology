---
id: oracle-tier-models-and-titles
date: 2026-10-31
title: "Separate free and Premium Oracle models and finish titles within the request"
summary: "Free members use free Ling for chat and titles. Premium defaults to DeepSeek chat and Nemo titles without provider training. Naming finishes within the stream lifecycle and preserves manual renames."
domains: [oracle, premium]
rules: [oracle.request-pipeline, oracle.model-routing, oracle.model-fallback, oracle.thread-titles]
status: accepted
sources:
  - doc: src/lib/ai/oracle-models.ts
---

## Context

All members previously used the same paid model. Automatic naming ran as detached work after the reply and the client checked for the title on a short timer. A slow title could remain invisible, and a late automatic update could overwrite a manual rename.

## Decision

Use the verified free Ling 3.1 Flash 1019 endpoint for free-member chat and titles. Premium defaults to DeepSeek V4.1 Flash chat and Mistral Nemo 12B titles, both pinned to DeepInfra with Gateway prompt training disallowed. Enforce model access using membership from the usage reservation, restrict free Ling to Novita, disable reasoning, and exclude preview/title-only rows from chat routing. Premium cannot select or fall back to free Ling. Premium prompt screening uses Jev with the same no-training filter, based on the authoritative reservation tier. Refused prompts release their reservation. Preserve guest preview replies and existing usage allowances.

Start a single bounded title attempt alongside a new chat. Await its conditional persistence before successful stream completion, then refresh the thread list once. Retain the immediate excerpt on failure or cancellation. The admin picker shows access, purpose, current pricing, and indicative latency for every configured entry, including informational title models.

## Alternatives

Laya can select supplied text but cannot generate a short title. A durable naming queue adds infrastructure for a low-impact feature. Repeated generation, paid fallback for free members, and polling add cost or request traffic without a sufficient benefit here.

## Consequences

Free endpoint availability and promotional prices may change. Provider routing, rather than model name alone, enforces Premium privacy. No-training filtering does not assert zero retention. DeepInfra policy: https://docs.deepinfra.com/account/data-privacy. Existing threads are not renamed or backfilled. Disconnects may retain excerpt titles. First reply tokens remain immediate; final stream completion can wait for the remaining title budget. Model-list display is informational and never substitutes for server enforcement.
