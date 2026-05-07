
show tables:
SELECT id, title, ward, citizen_name, aadhaar_last4, problem_id FROM complaints;

SELECT * FROM complaint_counters;

SELECT id, title, ward, "upvoteCount", summary FROM problems;

SELECT id, aadhaar_hash, aadhaar_last4 FROM complaints

Garbage Reports:
SELECT * FROM garbage_missed_reports ORDER BY created_at DESC;


clear tables:

TRUNCATE complaints, problems CASCADE;
UPDATE complaint_counters SET number_of_complaints = 0;






