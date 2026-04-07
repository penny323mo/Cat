-- Add report_url column to vet_record for PDF upload support
alter table vet_record add column if not exists report_url text;
