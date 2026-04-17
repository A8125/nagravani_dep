-- Migration to rename last_number column to number_of_complaints in complaint_counters table
-- This aligns the column name with its purpose for better clarity

ALTER TABLE complaint_counters RENAME COLUMN last_number TO number_of_complaints;