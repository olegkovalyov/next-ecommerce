This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Database

The project uses Drizzle ORM to work with PostgreSQL.

### Database Setup

1. Install PostgreSQL and create a new database
2. Update the `.env` file with your connection details:

```
DATABASE_URL=postgresql://username:password@localhost:5432/dbname
```

### Migrations

To create and apply migrations:

```bash
# Generate migration based on schema
npx drizzle-kit generate

# Apply migration to database (requires PG client)
npx drizzle-kit push
```

### Manual Database Initialization

If you need to reset the database and create it from scratch:

```bash
# Reset all data and recreate schema
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Apply migrations
psql $DATABASE_URL < infrastructure/db/migrations/0000_init.sql
```

### Running with Docker PostgreSQL (Local Development)

For local development, you can run PostgreSQL in a Docker container:

```bash
# Start PostgreSQL container
docker run --name postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -p 5432:5432 -d postgres:15

# Create database
docker exec -it postgres psql -U postgres -c "CREATE DATABASE next_ecommerce;"
```

Update your `.env` file:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/next_ecommerce
```

## Testing

### Unit Tests

Run unit tests with Jest:

```bash
npm run test
```

### Integration Tests

Integration tests use a separate test database that is created and set up automatically. The tests will:
1. Create a test database
2. Apply migrations
3. Run the integration tests
4. Clean up after completion

To run integration tests:

```bash
npm run test:integration
```

To run integration tests in watch mode:

```bash
npm run test:integration:watch
```

The test database configuration is managed in:
- `infrastructure/db/setup-test-db.ts` - Creates and sets up the test database
- `infrastructure/db/test-db.ts` - Provides connection to the test database
- `scripts/run-integration-tests.ts` - Orchestrates the test execution

To add new integration tests, create files with `.integration.ts` suffix in the relevant `__tests__` directories.

## CI/CD Integration Tests with Vercel

This project is configured to run integration tests in CI/CD environments. The following sections describe how this is set up.

### GitHub Actions Configuration

Integration tests are run through GitHub Actions on every pull request and push to the main branch. The workflow:

1. Sets up PostgreSQL as a service container
2. Runs migrations to set up the test schema
3. Executes integration tests against the service container

Example GitHub Actions workflow for integration tests:

```yaml
name: Integration Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_USER: postgres
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Set up test database
        run: npm run setup:test:db
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
```

### Vercel Deployment Integration

To run integration tests after Vercel deployments:

1. Configure a Vercel webhook for the `deployment.succeeded` event
2. Set up a GitHub workflow to listen for the webhook event
3. Run the integration tests against the deployment's database

Example workflow to run tests after Vercel deployment:

```yaml
name: Post-Deployment Tests

on:
  repository_dispatch:
    types: [vercel-deployment-complete]

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_USER: postgres
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
        with:
          ref: ${{ github.event.client_payload.sha }}
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Set up test database
        run: npm run setup:test:db
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          DEPLOYMENT_URL: ${{ github.event.client_payload.url }}
```

### Setting Up the Vercel Webhook

1. Go to your Vercel project settings
2. Navigate to the "Git Integration" tab
3. Under "Deploy Hooks", create a new webhook
4. Configure it to send a POST request to your GitHub repository dispatch endpoint:
   ```
   https://api.github.com/repos/{owner}/{repo}/dispatches
   ```
5. Include the following payload:
   ```json
   {
     "event_type": "vercel-deployment-complete",
     "client_payload": {
       "sha": "${VERCEL_GIT_COMMIT_SHA}",
       "url": "${VERCEL_URL}"
     }
   }
   ```

This setup allows you to automatically run integration tests after each Vercel deployment, ensuring your application works correctly with its database in each environment.
