-- Message requests are gone: opening a chat creates the EventMatch directly,
-- so the pending/accepted/declined table has no remaining readers.
DROP TABLE IF EXISTS "EventMessageRequest";
