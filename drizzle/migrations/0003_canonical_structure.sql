UPDATE entries
SET structured_data = jsonb_set(
  structured_data,
  '{schemaVersion}',
  '1'
)
WHERE structured_data->>'schemaVersion' IS NULL;

UPDATE entries
SET structured_data = jsonb_set(
  structured_data,
  '{type}',
  '"unknown"'
)
WHERE structured_data->>'type' = 'note';

UPDATE entries
SET structured_data = structured_data - 'title' - 'confidence'
WHERE structured_data ? 'title' OR structured_data ? 'confidence';
