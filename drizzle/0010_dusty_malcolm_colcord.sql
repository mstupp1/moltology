ALTER TABLE "leads" ADD COLUMN "emailOptIn" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "emailOptInAt" timestamp;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "emailOptIn" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "emailOptInAt" timestamp;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "emailOptInSource" text;