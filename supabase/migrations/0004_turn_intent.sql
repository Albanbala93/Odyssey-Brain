-- Persists the coach's turn intent (prompt/follow_up/challenge/support/
-- wrap_up) alongside the already-persisted correction. In particular
-- "wrap_up" drives the session UI's lesson-finished state — without this
-- column, an authenticated account reloading mid-session after the coach
-- wrapped up would lose that signal and see the reply box again.
alter table conversation_turns
  add column intent text;
