ALTER TABLE "user_stats" ADD COLUMN "moltmaxScore" integer;--> statement-breakpoint
ALTER TABLE "user_stats" ADD COLUMN "moltmaxClearance" text;--> statement-breakpoint
ALTER TABLE "user_stats" ADD COLUMN "moltmaxStage" text;--> statement-breakpoint
ALTER TABLE "user_stats" ADD COLUMN "moltmaxDimensionScores" jsonb;--> statement-breakpoint
ALTER TABLE "user_stats" ADD COLUMN "moltmaxCompletedAt" timestamp;