import { z } from 'zod'
import {
  DECISION_STATUSES,
  FLAG_LEVELS,
  FLOW_STEP_KINDS,
  FLOW_STEP_TONES,
  RULE_KINDS,
  RULE_STATUSES,
} from '../../../src/lib/logic-atlas/types'

const slug = /^[a-z0-9]+(?:[-.][a-z0-9]+)*$/

const anchorSchema = z.object({
  file: z.string().min(1),
  symbol: z.string().min(1),
})

const flowStepSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().min(1).max(60),
  kind: z.enum(FLOW_STEP_KINDS).default('check'),
  tone: z.enum(FLOW_STEP_TONES).default('neutral'),
  next: z
    .array(
      z.union([
        z.string(),
        z.object({ to: z.string(), label: z.string().max(24).optional() }),
      ]),
    )
    .default([]),
})

export const ruleSchema = z.object({
  id: z.string().regex(slug, 'Rule ids are lowercase words joined by dots or dashes.'),
  title: z.string().min(3).max(60),
  kind: z.enum(RULE_KINDS),
  status: z.enum(RULE_STATUSES).default('active'),
  statement: z.string().min(10).max(400),
  anchors: z.array(anchorSchema).default([]),
  tests: z.array(z.string()).default([]),
  dependsOn: z.array(z.string()).default([]),
  flag: z
    .object({
      level: z.enum(FLAG_LEVELS),
      note: z.string().min(10).max(300),
    })
    .optional(),
  flow: z.array(flowStepSchema).min(2).optional(),
})

export const domainSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(3).max(40),
  order: z.number().int(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  summary: z.string().min(10).max(240),
  rules: z.array(ruleSchema).min(1),
})

const sourceSchema = z.union([
  z.object({ pr: z.number().int().positive() }),
  z.object({ commit: z.string().regex(/^[0-9a-f]{7,40}$/) }),
  z.object({ changelog: z.string().min(1) }),
  z.object({ doc: z.string().min(1) }),
])

export const decisionSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  date: z.union([z.string(), z.date()]).transform((value, ctx) => {
    const iso = value instanceof Date ? value.toISOString().slice(0, 10) : value
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      ctx.addIssue({ code: 'custom', message: 'Dates use YYYY-MM-DD.' })
      return z.NEVER
    }
    return iso
  }),
  title: z.string().min(5).max(90),
  summary: z.string().min(10).max(240),
  domains: z.array(z.string()).min(1),
  rules: z.array(z.string()).default([]),
  status: z.enum(DECISION_STATUSES).default('accepted'),
  supersededBy: z.string().optional(),
  sources: z.array(sourceSchema).default([]),
})

export type RuleInput = z.infer<typeof ruleSchema>
export type DomainInput = z.infer<typeof domainSchema> & { overviewMarkdown: string; file: string }
export type DecisionInput = z.infer<typeof decisionSchema> & { bodyMarkdown: string; file: string }
export type FlowStepInput = z.infer<typeof flowStepSchema>

export function formatZodError(file: string, error: z.ZodError): string {
  return error.issues
    .map((issue) => `${file}: ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n')
}
