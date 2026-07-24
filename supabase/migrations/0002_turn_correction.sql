-- Persists the coach's structured correction (original/improved/explanationFr/
-- category) on the turn it happened on, so the debrief can reference what was
-- actually said instead of the mission's generic canned example. Previously
-- this data was only folded into recurring_errors and discarded otherwise.
alter table conversation_turns
  add column correction jsonb;
