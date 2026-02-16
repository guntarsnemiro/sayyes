-- Deleting user guntarsnemiro@inbox.lv (ID: 5a29a08c-fc97-44ec-adc1-ffbf4e85caa3)
-- This script deletes all related records to satisfy foreign key constraints.

PRAGMA foreign_keys = ON;

DELETE FROM sessions WHERE user_id = '5a29a08c-fc97-44ec-adc1-ffbf4e85caa3';
DELETE FROM invitations WHERE inviter_id = '5a29a08c-fc97-44ec-adc1-ffbf4e85caa3';
DELETE FROM push_subscriptions WHERE user_id = '5a29a08c-fc97-44ec-adc1-ffbf4e85caa3';
DELETE FROM feedback WHERE user_id = '5a29a08c-fc97-44ec-adc1-ffbf4e85caa3';
DELETE FROM checkins WHERE user_id = '5a29a08c-fc97-44ec-adc1-ffbf4e85caa3';
DELETE FROM commitments WHERE user_id = '5a29a08c-fc97-44ec-adc1-ffbf4e85caa3';
DELETE FROM users WHERE id = '5a29a08c-fc97-44ec-adc1-ffbf4e85caa3';
