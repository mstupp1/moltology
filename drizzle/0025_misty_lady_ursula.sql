ALTER TABLE "profiles" ADD COLUMN "isSimulated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "simulatedPersona" jsonb;