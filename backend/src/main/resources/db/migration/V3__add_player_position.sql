ALTER TABLE players ADD COLUMN position VARCHAR(10) DEFAULT 'UNKNOWN';

UPDATE players SET position = 'GK' WHERE name IN ('Nimanka');
UPDATE players SET position = 'LB' WHERE name IN ('Safi', 'Sa''ad', 'Danvir', 'Jag');
UPDATE players SET position = 'CB' WHERE name IN ('Syed', 'Arif', 'Abdulmalik','Yusuf', 'Yuvraj', 'Josh', 'Jana', 'Yousaf');
UPDATE players SET position = 'RB' WHERE name IN ('Mit', 'Akhil', 'Raf', 'Hassan', 'Biranavan', 'Zain');

UPDATE players SET position = 'CDM' WHERE name IN ('Kobi','Mashkoor', 'Shahan', 'Ravi');
UPDATE players SET position = 'CM' WHERE name IN ('Toni', 'Jahansher', 'Jamie', 'AJ', 'Ilyas', 'Junaid');
UPDATE players SET position = 'CAM' WHERE name IN ('Akshay', 'Matt', 'Akash', 'Munawar', 'Isa');

UPDATE players SET position = 'LW' WHERE name IN ('Nabeel', 'Ryan', 'Sahi');
UPDATE players SET position = 'ST' WHERE name IN ('Aqib', 'Ibrahim', 'Finlay', 'Faheem', 'Abdi', 'Suvi', 'Govin', 'Haaris Raza', 'Haaris Usman');
UPDATE players SET position = 'RW' WHERE name IN ('Corey', 'Hasnain', 'Vithu');
