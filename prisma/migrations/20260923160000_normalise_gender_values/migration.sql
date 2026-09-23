UPDATE "Profile" SET "gender" = 'Woman' WHERE lower("gender") IN ('female', 'woman');
UPDATE "Profile" SET "gender" = 'Man' WHERE lower("gender") IN ('male', 'man');
UPDATE "Profile" SET "gender" = 'Non-binary' WHERE lower("gender") IN ('nonbinary', 'non-binary');
