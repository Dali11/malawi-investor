-- ipos_seed.sql
-- Seeds the `ipos` table (see ipos_schema.sql) with real, historical IPOs
-- on the Malawi Stock Exchange. Sourced from MSE/AfricanFinancials public
-- IPO announcements — see comments per row.
--
-- No currently open or upcoming IPO could be confirmed on the MSE as of
-- July 2026, so this seed covers the two most recent completed listings
-- instead: Airtel Malawi (2020) and FDH Bank (2020). Both are already
-- linked to their `mse_counters` row via symbol lookup, since they're
-- long-listed. Run scripts/ipos_schema.sql first if you haven't already.
--
-- Run this in the Supabase SQL editor.

insert into ipos (
    counter_id, company_name, sector, status,
    offer_price, shares_offered, min_investment,
    open_date, close_date, listing_date,
    summary, details, prospectus_url
)
values
(
    (select id from mse_counters where symbol = 'AIRTEL'),
    'Airtel Malawi Plc',
    'Telecommunications',
    'Listed',
    12.69,
    2200000000, -- 1,650,000,000 base offer + 550,000,000 over-allotment
    null,
    '2019-12-27',
    '2020-01-31',
    '2020-02-24',
    'Airtel Malawi''s IPO offered 20% of the telecom to the public — the largest IPO in MSE history at the time.',
    'Fully underwritten offer of 1,650,000,000 ordinary shares with a 550,000,000-share over-allotment option at MWK 12.69/share. Listed as the 15th counter on the MSE Main Board.',
    null
),
(
    (select id from mse_counters where symbol = 'FDHB'),
    'FDH Bank Plc',
    'Financials',
    'Listed',
    10.00,
    1380206250, -- 979,175,000 offer for sale + 401,031,250 offer for subscription
    5000, -- 500-share minimum application at MWK 10/share
    '2020-06-29',
    '2020-07-17',
    '2020-08-03',
    'FDH Bank''s IPO offered a 20% public stake, partly to satisfy a listing obligation tied to its acquisition of Malawi Savings Bank.',
    'Offer for Sale of 979,175,000 shares and Offer for Subscription of 401,031,250 shares at MWK 10.00/share. Minimum application: 500 shares. Underwritten by First Discount House, Cedar Capital and Reunion Insurance.',
    null
);
