CREATE TABLE "compilations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"date" text NOT NULL,
	"compiled_at" timestamp DEFAULT now() NOT NULL,
	"content" text NOT NULL,
	"related_entry_ids" jsonb NOT NULL
);
--> statement-breakpoint
CREATE INDEX "compilations_user_id_date_idx" ON "compilations" USING btree ("user_id","date");