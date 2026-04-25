-- Migrate existing daily descriptions onto the first photo/video of each day,
-- but only if that step has no caption yet. Skip text-only steps (first_word,
-- milestone) so the description always lands on a visible piece of media.
WITH first_step_per_day AS (
  SELECT DISTINCT ON (baby_id, date) id, baby_id, date, caption
  FROM "step"
  WHERE photo_url IS NOT NULL
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
