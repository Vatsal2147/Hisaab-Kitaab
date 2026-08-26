# Hisaab Kitaab — Your AI-Powered Personal Finance Manager

> **Hisaab Kitaab** is your AI-powered, personal finance management platform that helps users track transactions, manage accounts, understand spending patterns, and receive personalized financial insights.

## Links

- **Live Demo:** `(https://hisaab-kitaab-virid.vercel.app/)`
- **GitHub:** `https://github.com/Vatsal2147/Hisaab-Kitaab`

---

## Features

- **User authentication** with Clerk
- **Multiple financial accounts** with account-specific balances
- **Income and expense tracking**
- **Transaction categorization**
- **Dashboard with spending visualizations**
- **AI receipt scanning** using Google Gemini
- **AI-generated monthly financial insights**
- **Automated monthly financial reports**
- **Automated budget alerts**
- **Email delivery** using Resend
- **Scheduled/background jobs** using Inngest
- **Rate limiting and request protection** using Arcjet
- **Responsive UI** built with Next.js and Tailwind CSS

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **Next.js** | Frontend and server-side application |
| **React** | UI components |
| **Tailwind CSS** | Styling |
| **shadcn/ui** | Reusable UI components |
| **Prisma** | Database ORM |
| **PostgreSQL** | Persistent data storage |
| **Clerk** | Authentication and user management |
| **Google Gemini** | Receipt scanning and financial insights |
| **Resend** | Transaction/budget/report emails |
| **Inngest** | Scheduled and background jobs |
| **Arcjet** | Rate limiting and request protection |
| **Vercel** | Deployment |

---

# Getting Started

## Prerequisites

You need:

- Node.js installed
- A PostgreSQL database
- Accounts/API credentials for the external services used by the application

## 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd finance
```

## 2. Install dependencies

```bash
npm install
```

## 3. Configure environment variables

Create a `.env` file in the project root.

Use the included `.env.example` as a template. The actual `.env` file is intentionally excluded from GitHub.

Required variables include:

```env
DATABASE_URL=
DIRECT_URL=

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

GEMINI_API_KEY=

RESEND_API_KEY=

ARCJET_KEY=

INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
```

Each developer should provide their own credentials for the required services.

## 4. Run the development server

```bash
npm run dev
```

The application will be available at:

```text
http://localhost:3000
```

### Quick setup

Once the environment variables are configured:

```bash
npm install && npm run dev
```

---

# Architecture Overview

Hisaab Kitaab uses **Next.js as a full-stack application**, meaning the frontend and server-side functionality live in the same project.

```text
                         Hisaab Kitaab
                              │
             ┌────────────────┴────────────────┐
             │                                 │
         Frontend                           Backend
             │                                 │
      React / Next.js                    Server Actions
      Tailwind CSS                       API Routes
      shadcn/ui                          Prisma
      Charts                             Business Logic
             │                                 │
             │              ┌──────────────────┼─────────────────┐
             │              │                  │                 │
             │            Clerk             Gemini            Resend
             │              │                  │                 │
             │              └────────────┬─────┴─────────────────┘
             │                           │
             │                        Inngest
             │                           │
             └───────────────────────────┼──────────────────────
                                         │
                                      PostgreSQL
```

## Frontend

The frontend is built with Next.js and React. It handles:

- Landing page
- Dashboard
- Account selection
- Transaction forms
- Receipt upload
- Spending charts
- Budget information
- Loading and error states
- Responsive layouts

Tailwind CSS and shadcn/ui are used for styling and reusable UI components.

## Backend

Next.js provides server-side functionality through Server Actions and API routes.

The backend handles:

- Authentication checks
- Transaction creation and editing
- Account validation
- Database operations
- Account balance updates
- Receipt processing
- Communication with external APIs
- Server-side business logic

A typical transaction flow is:

```text
User submits transaction
        ↓
Server Action
        ↓
Clerk authentication
        ↓
Validate user/account
        ↓
Prisma
        ↓
PostgreSQL
        ↓
Update transaction + account balance
        ↓
Return result to frontend
```

## Database

**PostgreSQL** stores persistent application data.

**Prisma** acts as the mediator between the application and PostgreSQL. Basically, it validates that the data coming in to the database has correct configuration, and schema.

The database stores information such as:

- Users
- Accounts
- Transactions
- Budgets
- Recurring transaction information
- Budget alert timestamps

Prisma database transactions are used when multiple related financial operations need to remain consistent.

---

# Authentication — Clerk

Clerk handles authentication and user identity.

Protected server-side operations retrieve the authenticated user's Clerk ID and use it to identify the corresponding application user.

This prevents users from accessing or modifying another user's financial data.

---

# AI Integration

Hisaab Kitaab uses **Google Gemini** for two main AI features.

## 1. AI Receipt Scanner

Users can upload a receipt instead of manually entering every transaction field.

```text
Receipt image
     ↓
Frontend upload
     ↓
Server-side processing
     ↓
Google Gemini
     ↓
Structured transaction information
     ↓
Transaction form
```

Gemini is instructed to extract:

- Total amount
- Date
- Description
- Merchant name
- Suggested transaction category

The model is asked to return structured JSON so the response can be parsed and used directly by the application.

Example:

```json
{
  "amount": 850,
  "date": "2026-08-25",
  "description": "Lunch",
  "merchantName": "Example Restaurant",
  "category": "food"
}
```

The Gemini API key is stored in an environment variable and accessed only from server-side code.

## 2. AI Financial Insights

The application generates personalized insights for monthly financial reports.

The server first calculates the user's monthly statistics:

```text
Total income
Total expenses
Net income
Expense categories
```

This information is then provided to Gemini.

### Prompt strategy

The prompt instructs Gemini to:

- Analyze spending patterns
- Identify potential areas for saving
- Provide practical financial advice
- Keep the advice concise
- Use a friendly and conversational tone
- Return structured output

Conceptually, the prompt looks like:

```text
Analyze this financial data and provide 3 concise,
actionable insights.

Focus on:
- Spending patterns
- Areas where the user can save
- Practical financial advice

Keep the insights friendly and conversational.

Financial Data for [month]:
- Total Income: [income]
- Total Expenses: [expenses]
- Net Income: [net income]
- Expense Categories: [category data]
```

The generated insights are included in the user's monthly financial report email.

### Why use an LLM?

Traditional code can calculate:

```text
Income = ₹50,000
Expenses = ₹32,000
Food = ₹8,000
Shopping = ₹10,000
```

but it does not naturally turn those numbers into contextual observations.

Gemini adds a natural language reasoning layer that can turn financial data into practical suggestions.

The AI output is treated as **informational guidance rather than professional financial advice**.

---

# Automated Background Jobs — Inngest

Inngest is used for tasks that should happen automatically without the user manually triggering them.

## Monthly Financial Reports

On the first day of every month:

```text
Inngest cron
     ↓
Fetch users
     ↓
Calculate previous month's statistics
     ↓
Generate Gemini insights
     ↓
Render email template
     ↓
Send through Resend
```

Each user receives a personalized monthly report containing:

- Total income
- Total expenses
- Net income
- Spending by category
- AI-generated insights

## Budget Alerts

The application periodically checks users' budgets.

When spending reaches the configured threshold, the system can send a budget alert containing:

- Budget amount
- Amount spent
- Percentage used
- Remaining budget

The database records when an alert was last sent to prevent repeated alerts within the same month.

---

# Email — Resend

Resend is used to send application-generated emails.

React Email templates are used to generate structured emails such as:

- Monthly financial reports
- Budget alerts

The templates receive dynamic data from the backend, allowing each email to contain the user's actual financial information and AI-generated insights.

---

# Security & Rate Limiting — Arcjet

Arcjet provides request protection and rate limiting.

For protected operations, the server identifies the user and applies a token-bucket rate limit.

```text
Request
   ↓
Arcjet
   ↓
Rate limit check
   ├── Allowed → Continue
   └── Denied → Return error
```

This helps prevent excessive requests to sensitive or resource-intensive functionality.

---

# Error Handling

The application includes error handling for external services and server-side operations.

For example, if Gemini fails while generating financial insights, the application provides fallback insights instead of leaving the monthly report without content.

Receipt scanning catches API failures and returns an appropriate error rather than creating a transaction from invalid AI output.

Database operations that update multiple pieces of financial data can use Prisma database transactions to maintain consistency.

---

# Deployment

The production application is deployed using **Vercel**.

Environment variables are configured separately in the Vercel project settings rather than being committed to GitHub.

```text
GitHub
   ↓
Vercel
   ↓
Next.js application
   ├── Frontend
   └── Server-side functions
          ↓
   External services
```

This keeps API keys and other sensitive credentials out of the public repository.

---

# Known Limitations

- Receipt scanning accuracy depends on the quality and readability of uploaded receipts.
- Gemini API availability and rate limits can affect AI-powered functionality.
- AI-generated insights may occasionally be inaccurate or overly general.
- The free/testing configuration of Resend limits email recipients until a sending domain is verified.
- Scheduled functionality depends on correct Inngest configuration and deployment.
- The application currently focuses on personal expense and income management rather than advanced investment or portfolio management.
- Users running the project locally must configure their own API keys and external services.
- AI-generated financial insights should not be considered professional financial advice.

---

# Future Improvements

- More advanced spending trend analysis
- Customizable budget thresholds
- Recurring transaction management
- Improved receipt recognition and validation
- More detailed financial dashboards
- CSV/PDF financial exports
- Additional AI-powered financial recommendations
- Automated savings recommendations
- Improved accessibility and keyboard navigation
- Expanded automated unit and end-to-end test coverage
- More granular notification preferences
- Support for additional currencies and localization

---

# Project Structure

```text
finance/
│
├── app/                    # Next.js pages and routes
├── components/             # Reusable React components
├── actions/                # Server-side actions
├── emails/                 # React Email templates
├── lib/
│   ├── prisma.js           # Database client
│   └── inngest/            # Background job functions
│
├── prisma/
│   └── schema.prisma       # Database schema
│
├── public/                 # Static assets
│
├── .env.example            # Environment variable template
├── .gitignore
├── next.config.mjs
├── package.json
└── README.md
```

---

# License

This project was developed as an academic/portfolio project.
