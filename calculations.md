# Dashboard Metric Calculations

This document details how each metric in the dashboard is calculated, based on the data in the database and the backend logic.

## Data Sources
The dashboard primarily aggregates data from the following database tables:
- **Lead**: Potential customers.
- **BookedCall**: Calls scheduled via Calendly.
- **Deal**: Sales opportunities synced from the CRM (Close.com).
- **Payment**: Transactions synced from Stripe.
- **OpportunityStatusMapping**: Configuration mapping CRM stages to "Showed Up" status.

## Date Filtering
Most metrics support filtering by a time period (e.g., "Last 30 Days", "Month to Date", "Custom Range").
- **Date Filter Logic**: The system filters records where the relevant date field (e.g., `createdAt`, `paidAt`, `scheduledAt`) falls within the selected start and end dates (inclusive).

---

## Metrics

### 1. Total Revenue
**Definition**: The total amount of cash collected from successful payments.
- **Calculation**: Sum of `amountCents / 100` for all payments.
- **Filters**:
  - `status`: Must be `'succeeded'`.
  - `paidAt`: Must be within the selected date range.
- **Source**: `Payment` table.

### 2. Avg Leads/Month
**Definition**: The average number of new leads generated per month.
- **Calculation**: `Total Leads / Months Count`
  - `Total Leads`: Count of `Lead` records created within the selected date range.
  - `Months Count`: Determined by the selected date range (e.g., 1 for "Month to Date", or calculated based on the number of days for custom ranges).
- **Source**: `Lead` table (Frontend calculation).

### 3. Speed to Lead
**Definition**: The average time it takes to make the first contact with a new lead.
- **Calculation**: Average of `(Lead.firstContactDate - Lead.createdAt)` in hours.
- **Inclusions**:
  - Only leads with a non-null `firstContactDate`.
  - Only leads where the time difference is **greater than or equal to 10 minutes** (excludes instant auto-responses).
- **Filters**: `createdAt` within the selected date range.
- **Source**: `Lead` table.

### 4. Failed Payment Amount (Yearly)
**Definition**: The projected yearly amount of failed payments based on recent data.
- **Calculation**: `(Average Daily Failed Amount) * 12`
  - *Note*: The multiplier `12` in the code suggests a projection, but mathematically `Daily Amount * 12` projects to 12 days, not a year (365 days). This appears to be a specific logic implementation where the "Yearly" figure is derived this way.
  - `Average Daily Failed Amount`: `Total Failed Amount / Days In Range`.
  - `Total Failed Amount`: Sum of `amountCents / 100` for all payments with `status: 'failed'`.
  - `Days In Range`: Number of days between the first and last failed payment found (minimum 1 day).
- **Filters**: Considers *all* failed payments for the client (not restricted by the dashboard date filter).
- **Source**: `Payment` table.

### 5. Booking Rate
**Definition**: The percentage of leads that result in a booked call.
- **Calculation**: `(Booked Calls / Total Leads) * 100`
- **Components**:
  - `Booked Calls`: Count of `BookedCall` records scheduled within the date range.
  - `Total Leads`: Count of `Lead` records created within the date range.
- **Source**: `BookedCall` and `Lead` tables.

### 6. Cancellation Rate
**Definition**: The percentage of booked calls that are cancelled.
- **Calculation**: `(Cancelled Calls / Booked Calls) * 100`
- **Components**:
  - `Cancelled Calls`: Count of `BookedCall` records with `status: 'cancelled'` scheduled within the date range.
  - `Booked Calls`: Total count of `BookedCall` records scheduled within the date range (including cancelled ones).
- **Source**: `BookedCall` table.

### 7. Show Up Rate
**Definition**: The percentage of scheduled calls where the prospect showed up.
- **Calculation**: `(Show Ups / Total Scheduled Calls) * 100`
- **Components**:
  - `Total Scheduled Calls`: Count of `BookedCall` records (source 'calendly') that are **not** cancelled, scheduled within the date range.
  - `Show Ups`: Number of those calls that can be matched to a CRM Deal which reached a "Showed Up" stage.
    - **Matching Logic**: A call is considered a "Show Up" if a Deal exists that:
      1. Has a stage mapped to "Showed Up" (via `OpportunityStatusMapping`).
      2. Was created or had a stage change within **7 days** of the call's scheduled date.
- **Source**: `BookedCall`, `Deal`, `OpportunityStatusMapping`.

### 8. Close Rate
**Definition**: The percentage of "Showed Up" opportunities that were won.
- **Calculation**: `(Won Deals / Showed Up Deals) * 100`
- **Components**:
  - `Showed Up Deals`: Count of `Deal` records (source 'close') within the date range (created or updated) that are in a stage mapped to "Showed Up".
  - `Won Deals`: Count of `Deal` records (source 'close') within the date range that have `status: 'won'`.
- **Source**: `Deal`, `OpportunityStatusMapping`.

### 9. CRM Hygiene
**Definition**: A score (0-100) representing the quality of data in the CRM.
- **Calculation**: `100 - (Total Issues / Total Items) * 100`
- **Total Issues**: Sum of:
  - **Leads without status**: `Lead` records with `status: null`.
  - **Stuck Deals**: `Deal` records that haven't changed stage in >7 days (or created >7 days ago with no changes).
  - **Deals without amount**: `Deal` records with `amount: null`.
- **Total Items**: `Total Leads` + `Total Deals`.
- **Filters**: Evaluates current state (not date-filtered).
- **Source**: `Lead`, `Deal`.

### 10. Average Deal Value
**Definition**: The average revenue per closed-won deal.
- **Calculation**: `Total Revenue / Won Deals Count`
- **Components**:
  - `Total Revenue`: Sum of successful payments (same as Metric #1).
  - `Won Deals Count`: Count of `Deal` records with `status: 'won'` created within the date range.
- **Source**: `Payment`, `Deal`.

### 11. Pipeline Velocity
**Definition**: The average number of days it takes for a lead to become a won deal.
- **Calculation**: Average of `(Deal Won Date - Lead Created Date)` in days.
- **Logic**:
  - Finds `Deal` records with `status: 'won'`.
  - Finds the associated `Lead` (earliest one linked to the deal).
  - Calculates time difference.
- **Filters**: Only includes deals where the "Won Date" (last stage change or update) is within the selected date range.
- **Source**: `Deal`, `Lead`.
