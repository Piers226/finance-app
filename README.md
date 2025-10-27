# M3: My Money Manager

![M3 Finance App Screenshot](public/app_icon.png)

## Live Demo

Experience M3 Finance live at [m3finance.app](https://m3finance.app)

## Project Overview

M3 is a cutting-edge personal budget tracking application built with a focus on intelligent automation and a seamless user experience. It empowers users to effortlessly track expenses, manage budgets, and gain profound insights into their spending habits through an intuitive interface and powerful AI-driven features.

## Key Features

### AI-Powered Transaction Categorization

Leveraging advanced AI, M3 intelligently categorizes your transactions, making financial management smarter and more efficient. This feature includes:

*   **Batch Processing**: Optimizes performance by processing the 50 most recent uncategorized transactions in each run.
*   **Enhanced AI Prompting**: Integrates Plaid's `personal_finance_category` data into the AI prompt, providing richer context for highly accurate categorization.
*   **Dedicated Review Flow**: AI-categorized transactions are routed to a `PendingTransaction` table, allowing users to review and approve suggestions with pre-selected categories in the UI.
*   **Usage Limits**: A `chatCount` on the User model manages AI categorization runs, ensuring responsible resource utilization.

### Seamless Bank Integration with Plaid

M3 integrates with Plaid to securely link your bank accounts and fetch transaction data, providing a real-time view of your finances.

*   **Initial Sync**: Automatically imports historical transactions upon linking a new bank account.
*   **Manual Sync**: Easily refresh your transaction data with a single click to ensure your budget is always up-to-date.

### Intuitive Pending Transaction Management

Take control of your uncategorized transactions with a flexible review system:

*   **Editable Amounts**: Adjust transaction amounts directly within the pending list.
*   **Collaborate Option**: Quickly convert a pending transaction into a payback entry, pre-filling details and setting a reminder date one month out.
*   **Expandable List**: A collapsible section for pending transactions, clearly displaying the count of items awaiting review.

### Integrated Payback Tracker

Manage money owed to you or by you with ease:

*   **Manual Entry**: Add payback transactions directly.
*   **Pre-fill from Pending**: Automatically populate payback details from pending transactions for quick creation.
*   **Split Functionality**: Divide transaction amounts among multiple people, automatically adjusting the payback amount.
*   **Transaction Table Integration**: Optionally add payback entries to your main transaction list, ensuring comprehensive financial records.

## Technical Architecture

M3 is built on a robust and modern technology stack:

*   **Framework**: [Next.js](https://nextjs.org/) (with React) for a high-performance, full-stack application experience.
*   **Authentication**: [Next-Auth.js](https://next-auth.js.org/) for secure and flexible authentication.
*   **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) ODM for efficient and scalable data management.
*   **Bank Integration**: [Plaid](https://plaid.com/) API for secure and reliable bank account linking and transaction fetching.
*   **UI/UX**: [Material-UI (MUI)](https://mui.com/) for a responsive, accessible, and aesthetically pleasing user interface.
*   **Linting**: [ESLint](https://eslint.org/) for maintaining high code quality and consistency.

The application follows a standard Next.js project structure:

*   **`src/app`**: Houses main application pages and API routes.
*   **`src/app/api`**: Backend API endpoints for data operations (transactions, users, Plaid integration).
*   **`src/components`**: Reusable React components (e.g., `PlaidLinker`, `TransactionForm`).
*   **`src/lib`**: Utility files for external service connections (MongoDB, Plaid).
*   **`src/models`**: Mongoose schemas defining MongoDB data structures.

## Getting Started

To set up and run M3 locally, follow these steps:

### Prerequisites

*   Node.js and npm (or yarn/pnpm/bun)
*   A MongoDB database and its connection URI.
*   Plaid API keys (`PLAID_CLIENT_ID`, `PLAID_SECRET`).

### Environment Variables

Create a `.env.local` file in the root of the project with the following variables:

```
MONGODB_URI=<your_mongodb_connection_string>
PLAID_CLIENT_ID=<your_plaid_client_id>
PLAID_SECRET=<your_plaid_secret>
PLAID_ENV=sandbox
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<a_random_secret_string>
```

### Installation

```bash
npm install
```

### Running the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Building for Production

```bash
npm run build
```

### Running in Production

```bash
npm run start
```

## Development Conventions

*   **Linting**: Run `npm run lint` to check for code quality and style issues. Configuration is in `eslint.config.mjs`.
*   **Path Aliases**: `@/*` aliases `src/*` (configured in `jsconfig.json`).
*   **API Routes**: Backend logic is handled via `src/app/api` routes.
*   **Database Models**: Mongoose schemas define MongoDB data structure.
*   **Components**: UI built with React components and Material-UI for styling.