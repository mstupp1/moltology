---
id: oracle-skills
date: 2026-11-14
title: "Sell Oracle skills in the Shop"
summary: "Members can buy Oracle skills with Gems. Four skills are free, and staff and Oracle MAX members get every skill."
domains: [economy, oracle]
rules: [economy.oracle-skill-prices, economy.market-purchases, oracle.skill-context, oracle.custom-instructions]
status: accepted
sources:
  - pr: 469
  - pr: 474
---

## Context

Oracle skills are written methods the Oracle can walk a member through, such as focus rounds or box breathing. They needed a clear way to be owned, and Gems needed more to spend on than gear.

## Decision

There are twelve skills. Four are free starters, five cost 60 Gems, and three cost 150. Buying a skill uses the same locked Gems-then-Credits batch as gear and records it in `oracle_skill_unlocks`. Staff and members with an active Oracle MAX subscription can use every skill. The Oracle only suggests skills the member owns, and members can turn that suggestion off.

## Alternatives

- Make skills a MAX-only feature. Rejected because skills are a good thing to spend earned Gems on.
- Give every skill to everyone. Rejected because it would leave Gems with less to buy.

## Consequences

Skills are help, not rank, so selling them keeps to the red line. The skill playbook goes into the prompt only for the conversation that uses it. The same release added an Oracle personality and up to 1,000 characters of custom instructions. Laya screens the instructions, and the prompt keeps them below the safety rules.
