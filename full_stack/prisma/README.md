# Steps to regenerate the database
1. npx prisma generate - Generates the Prisma client
2. npx prisma db push - Creates the database schema (empty tables)
3. npm run db:seed - Populates the tables with test data
