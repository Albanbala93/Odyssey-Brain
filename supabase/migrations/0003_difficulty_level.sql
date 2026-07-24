-- User-chosen difficulty level (Settings > Niveau). "adaptive" (default)
-- keeps the existing confidence-based automatic behavior; any other value
-- is an explicit override that takes priority over it.
alter table user_preferences
  add column difficulty_level text not null default 'adaptive'
    check (difficulty_level in ('adaptive', 'easy', 'medium', 'hard'));
