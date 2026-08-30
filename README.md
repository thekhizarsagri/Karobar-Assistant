# Karobar Assistant

An AI-powered Business Intelligence & Analytics Platform built with clean, purposeful code.

> **Status:** This project is actively in development. New features, analyses, and improvements are being added regularly. Each commit represents quality work that has been tested and verified.

---

## About

Karobar Assistant is a full-stack web application that helps small businesses manage production, sales, inventory, expenses, and make data-driven decisions using AI and statistical analysis.

Every feature has been designed, implemented, and refined one step at a time.

I commit less because I only push when the work is tested, verified, and genuinely adds value. Quality over quantity.

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Python 3** | Core language |
| **FastAPI** | High-performance async REST API framework |
| **Pydantic** | Request validation and schema definitions |
| **Pandas** | DataFrame operations for sales aggregation, analytics, and forecasting |
| **NumPy** | Numerical computation — linear regression, statistical analysis, confidence intervals |
| **Uvicorn** | ASGI server |

### Frontend
| Technology | Purpose |
|---|---|
| **React 19** | UI component library |
| **React Router DOM 7** | Client-side routing |
| **Vite 8** | Build tool and dev server |
| **CSS3** | All styling — no UI framework, no Tailwind, hand-written CSS |
| **Custom SVG Charts** | All charts (bar, donut, forecast, horizontal bar) built from scratch with inline SVGs |

### Testing & Tools
| Technology | Purpose |
|---|---|
| **Pytest** | Backend unit testing (28 tests across 5 test files) |
| **OxLint** | Frontend linting |
| **Git** | Version control |

### Data & Storage
| Approach | Detail |
|---|---|
| **In-Memory Store** | Primary mode — data lives in Python dicts/lists during runtime |
| **Optional JSON Persistence** | Set `KAROBAR_PERSIST=1` to save to disk — atomic writes with `.tmp` + rename |
| **No SQL Database** | Deliberately lightweight — no SQLite, PostgreSQL, or ORM |

---

## AI & Data Science

This is where the project gets serious. Karobar Assistant includes **14 distinct analytical capabilities** — all implemented with Pandas and NumPy.

### Statistical Analysis
- **ABC (Pareto) Classification** — Classifies products into A/B/C tiers based on cumulative revenue contribution. The classic 80/20 rule applied to inventory.
- **Product Velocity Analysis** — Identifies top movers and slow movers (including dead stock) based on average daily sales.
- **Seasonality Index** — Computes a 12-month seasonality index showing which months over/underperform against the average.
- **Expense Pareto Analysis** — Ranks expenses by magnitude with cumulative percentage to find where the money actually goes.

### Forecasting
- **Demand Forecasting (Ensemble Model)** — Combines 60% linear regression with 40% 3-day moving average on a 14-day sliding window. Includes 95% confidence intervals and MAPE accuracy scoring.
- **Trend Detection** — Automatically classifies each product's demand trend as upward, downward, or steady.
- **Confidence Classification** — Labels forecast reliability as high/medium/low based on available data points.

### Financial Analysis
- **Break-Even Analysis** — Calculates contribution margin ratio, break-even revenue, and break-even units per product.
- **Economic Order Quantity (EOQ)** — Classic inventory optimization formula to determine optimal order sizes.
- **GMROI (Gross Margin Return on Investment)** — Measures inventory profitability relative to cost.
- **Inventory Turnover & DIO** — Tracks how fast inventory cycles and days outstanding.

### Inventory Intelligence
- **Safety Stock Calculation** — Z-score based (1.65 for 95% service level) with lead time consideration.
- **Reorder Point (ROP)** — Automated reorder triggers based on demand velocity and lead time.
- **Dead Stock Detection** — Flags products with no sales in 30+ days.
- **Days of Supply** — Calculates how long current stock will last.

### KPI Health Score
- A weighted composite score (0-100) combining profit performance, stock health, and inventory turnover into a single actionable metric.

---

## Features

### Setup & Onboarding
- Multi-step business setup wizard (business info, products, expenses)
- Product catalog with categories, costs, and pricing
- Expense tracking with enable/disable toggles
- Demo mode for instant exploration

### Dashboard
- Real-time stat cards (total stock, gross profit, net profit, total expenses)
- Record sales with product selection, quantity, and date
- AI-powered alerts (low stock, negative profit, out-of-stock)
- Stock overview modal with current levels
- Add stock (one-time or automatic scheduling)
- Notification system with unread counts

### Sales Analytics
- Monthly bar charts with trend visualization
- Yearly stacked charts
- Per-product trend lines with product selector
- Daily, monthly, and yearly aggregation views

### AI Insights
- ABC Pareto classification table
- Product velocity panel (top movers / slow movers)
- CSV export for analysis data

### Demand Forecasting
- Per-product forecast cards with 14-day history charts
- Projected next-day demand with 95% confidence bounds
- Trend direction and confidence level indicators
- MAPE accuracy score per product
- Product search filter

### Inventory Management
- Full inventory table with search, status, and category filters
- Stock health indicators (healthy / reorder / out-of-stock)
- Safety stock, reorder point, and days of supply per item
- Category breakdown donut chart
- Recent stock movements log
- Add stock modal with date selection

### Business Reports
- KPI health score with sub-scores
- Full financial breakdown (revenue, COGS, gross/net profit, margins)
- GMROI, inventory turnover, and DIO metrics
- Per-product break-even analysis
- EOQ optimization
- Seasonality bar chart (12-month)
- Expense Pareto chart

### Product History
- Per-product sales and stock history
- Drill-down into individual transactions
- Clear history per product
- CSV export for sales and stock history

### Automation
- Scheduled automatic stock additions
- Day-of-month and time configuration
- Run-now test button
- Schedule management

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### Installation
```bash
# Clone the repo
git clone https://github.com/thekhizarsagri/Karobar-Assistant.git
cd Karobar-Assistant

# Install backend dependencies
pip install -r backend/requirements.txt

# Install and build frontend
cd frontend && npm install && npm run build
cd ..
```

### Run
```bash
uvicorn backend.main:app --reload
```
Then open **http://127.0.0.1:8000** in your browser.

### Development (Hot Reload)
```bash
# Terminal 1 — API
uvicorn backend.main:app --reload

# Terminal 2 — Frontend dev server
cd frontend && npm run dev
```

### Tests
```bash
python -m pytest backend/tests -v
cd frontend && npm run lint
cd frontend && npm run build
```

---

## Project Structure

```
Karobar-Assistant/
├── backend/
│   ├── main.py                 # FastAPI app entry point
│   ├── routes.py               # All API endpoint definitions
│   ├── schemas.py              # Pydantic request models
│   ├── models.py               # Dataclasses (Product, Expense, SaleEntry, etc.)
│   ├── store.py                # In-memory data store
│   ├── persistence.py          # Optional JSON file persistence
│   ├── profile.py              # Business profile builder
│   ├── dashboard.py            # Dashboard payload assembler
│   ├── metrics.py              # Profitability calculations
│   ├── sales.py                # Sale recording & history
│   ├── stock.py                # Stock management
│   ├── alerts.py               # Alert system with dismissal
│   ├── notifications.py        # Notification CRUD
│   ├── insights.py             # AI insights engine
│   ├── forecast.py             # Linear forecast
│   ├── aggregation.py          # Pandas sales aggregation
│   ├── abc_analysis.py         # ABC Pareto classification
│   ├── product_velocity.py     # Velocity analysis
│   ├── forecast_export.py      # Ensemble forecasting + CSV export
│   ├── data_analytics.py       # Advanced analytics orchestrator
│   ├── inventory.py            # Inventory analytics
│   ├── inventory_helpers.py    # Inventory helper functions
│   ├── reports.py              # Business reports
│   ├── reports_helpers.py      # Report helper functions
│   ├── reports_analysis.py     # Break-even, EOQ, seasonality, Pareto
│   └── tests/                  # 28 pytest tests
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Router + SwipePages
│   │   ├── index.css           # Global styles (Inter font)
│   │   ├── components/
│   │   │   ├── Welcome.jsx
│   │   │   ├── SetupPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── setup/          # Setup wizard forms
│   │   │   ├── dashboard/      # Dashboard UI components
│   │   │   ├── analytics/      # Charts, AI panels, forecasting
│   │   │   ├── inventory/      # Inventory management
│   │   │   └── reports/        # Business report sections
│   │   ├── styles/             # 21 CSS files
│   │   └── utils/              # Formatting utilities
│   └── package.json
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `POST` | `/api/reset` | Clear all data |
| `POST` | `/api/dashboard` | Submit setup form, return dashboard |
| `GET` | `/api/dashboard` | Get current dashboard data |
| `POST` | `/api/sales` | Record a sale |
| `POST` | `/api/stock` | Add inventory |
| `GET` | `/api/alerts` | Get active alerts |
| `POST` | `/api/alerts/clear` | Dismiss all alerts |
| `GET` | `/api/notifications` | Get notifications |
| `POST` | `/api/notifications` | Create notification |
| `POST` | `/api/notifications/read` | Mark as read |
| `POST` | `/api/notifications/clear` | Clear notifications |
| `GET` | `/api/analytics` | Sales analytics |
| `GET` | `/api/analytics/advanced` | AI analytics (ABC, velocity, forecast) |
| `GET` | `/api/analytics/export` | Export analytics CSV |
| `GET` | `/api/inventory` | Inventory details |
| `GET` | `/api/reports` | Business reports |
| `GET` | `/api/history/export` | Export sales/stock history |
| `POST` | `/api/history/clear/{product}` | Clear product history |

---

## Author

Built entirely by **Khizar Sagri** — from the backend logic to the frontend UI to every analytical algorithm.

This project is a journey into AI and data science applied to real business problems. Every feature is built to solve an actual need.

---

## License

This project is currently private and in active development.
