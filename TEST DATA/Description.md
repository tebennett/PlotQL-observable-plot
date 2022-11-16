# TEST DATA

This file describes the test data that is being used

# Superstore

Superstore is tableau's sample data for getting started.  I thought it would be better to use this instead of sales_data_sample, due to the complex plots that tableau creates for it.  The original comes in an excel file, but had to be converted to csv for import into postgres.  For importing the csv file, make sure to use headers, turn off '  for literal quoting, and use win 1251 for encoding (the csv has utf-8 characters in it).  The table has to be created first with the superstore.sql file.  I'm using Superstore on the new Postgres 15 database.

# sales_data_sample

Not as complex as superstore, but similar.

# data_table_for_daily_case_trends__the_united_states

Covid data straight from the CDC.  I was originally using this but switched to sales data, because it is a simple time plot.  Sales data provides for more complex examples to work with, especially Superstore.
