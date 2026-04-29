ALTER TABLE "ServiceTicket"
  ALTER COLUMN "pressureGauge" TYPE TEXT
  USING CASE
    WHEN "pressureGauge" = true  THEN 'yes'
    WHEN "pressureGauge" = false THEN 'no'
    ELSE NULL
  END;
