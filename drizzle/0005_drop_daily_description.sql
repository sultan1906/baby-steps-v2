-- Migrate existing daily descriptions onto the first photo of each day,
-- but only if that photo has no caption yet.
WITH first_step_per_day AS (
  SELECT DISTINCT ON (baby_id, date) id, baby_id, date, caption
  FROM "step"
  ORDER BY baby_id, date, created_at ASC
)
UPDATE "step" AS s
SET caption = dd.description
FROM first_step_per_day fs
INNER JOIN "daily_description" dd
  ON dd.baby_id = fs.baby_id AND dd.date = fs.date
WHERE s.id = fs.id
  AND (s.caption IS NULL OR s.caption = '')
  AND dd.description IS NOT NULL
  AND dd.description <> '';
--> statement-breakpoint
DROP TABLE "daily_description" CASCADE;
