# PIM Agents — Multi-Agent Product Information Management System

A production-grade, human-in-the-loop Product Information Management (PIM) system built with **FastAPI**, **LangGraph**, and a modern **React (TanStack Router + Vite)** frontend.

The project coordinates specialized AI and deterministic agents to audit e-commerce catalogs, generate grounded product enrichment proposals, enforce schema and business validation, and sync approved updates to WooCommerce.

---

## 🏛️ Architecture Overview

```
                                      +--------------------------+
                                      |     React Frontend       |
                                      |  (TanStack / Tailwind)   |
                                      +-------------+------------+
                                                    |
                                         HTTP / REST (FastAPI)
                                                    |
                                      +-------------v------------+
                                      |      FastAPI Backend     |
                                      |  /api/stats, /api/runs   |
                                      |  /api/proposals, /sync   |
                                      +-------------+------------+
                                                    |
                                        [ LangGraph StateGraph ]
                                                    |
                        +---------------------------+---------------------------+
                        |                                                       |
             +----------v----------+                                 +----------v----------+
             |  Orchestrator Plan  |                                 |  Human Review Gate  |
             +----------+----------+                                 |  Explicit Approval  |
                        |                                            +----------+----------+
             +----------v----------+                                            |
             |   Catalog Analyst   | (Deterministic Inspection)                 v
             +----------+----------+                                 +---------------------+
                        |                                            | WooCommerce Adapter |
             +----------v----------+                                 | (Mock or Real REST) |
             |  Enrichment Agent   | <---+ (Bounded Retry)           +---------------------+
             +----------+----------+     |
                        |                |
             +----------v----------+     |
             |    Quality Agent    | ----+
             | (Deterministic QA)  |
             +----------+----------+
                        |
             +----------v----------+
             | Orchestrator Finish |
             +---------------------+
```

### 🤖 Multi-Agent Workflow Components

1. **Catalog Analyst Agent (`backend/agents/analyst.py`)**:
   - Deterministically audits products against catalog standards.
   - Identifies missing descriptions, descriptions under 80 characters, empty required attributes, and invalid pricing.
   - **Grounding Rule**: Strictly flags factual issues and never invents missing specifications.

2. **Enrichment Agent (`backend/agents/enricher.py`)**:
   - Generates structured proposals (`ProposedChange`) for incomplete listings.
   - Supports Google Gemini (`gemini-2.5-flash`), OpenAI (`gpt-4o-mini`), or grounded deterministic copy engines when running offline.
   - **Grounding Rule**: Never invents technical specs (e.g., dimensions, wattage) without verified source attributes. If ungrounded, flags attribute for merchant confirmation.
   - **Human-in-the-Loop Constraint**: Emits proposals strictly with `status="pending"`. Agents are never permitted to auto-approve.

3. **Quality Agent (`backend/agents/quality.py`)**:
   - Deterministic validator decoupled from LLM non-determinism.
   - Enforces length requirements (>= 50 chars), checks for banned placeholder tokens (`[TODO]`, `lorem ipsum`, placeholder text), and validates schema integrity.
   - Manages bounded retries: if validation issues occur, routes feedback back to the Enrichment Agent (up to `max_agent_retries = 2`), preventing infinite loops.

4. **Orchestrator (`backend/agents/orchestrator.py` & `backend/services/workflow_runner.py`)**:
   - Built on **LangGraph** `StateGraph`.
   - Manages shared state `PIMWorkflowState`, routes between nodes, captures real-time `AgentEvent` records, and handles error states.

5. **WooCommerce Adapter (`backend/adapters/woocommerce.py`)**:
   - **Mock Mode (Default)**: Fully demonstrable out-of-the-box without WooCommerce credentials. Simulates catalog sync and returns structured `SyncResult` logs.
   - **Real REST API Mode**: Securely calls WooCommerce REST API v3 when valid credentials (`WC_URL`, `WC_CONSUMER_KEY`, `WC_CONSUMER_SECRET`) are configured.
   - **Security**: Never exposes credentials or secrets to the frontend or in error messages.

---

## 🚀 Quickstart: Running the Application

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 2. Start the FastAPI Backend

Open a terminal in the root directory:

```bash
# Navigate to project root
cd kilowott_org

# Install Python dependencies
python -m pip install -r backend/requirements.txt

# Start FastAPI server on port 8000
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

The API will be available at:
- **API URL**: `http://127.0.0.1:8000`
- **Swagger Docs**: `http://127.0.0.1:8000/docs`

### 3. Start the React Frontend

Open a second terminal:

```bash
# Navigate to frontend directory
cd kilowott_org/frontend

# Install dependencies (if not already installed)
npm install --legacy-peer-deps

# Start Vite dev server
npm run dev
```

The frontend will run at `http://localhost:5173` (or the port indicated by Vite) and communicates directly with `http://127.0.0.1:8000`.

---

## 🧪 Testing

### Backend Test Suite (Pytest)

The backend includes 20 comprehensive unit and integration tests covering:
- **Workflow Routing**: LangGraph state machine flow and event generation.
- **Deterministic Validation**: Quality Agent rule enforcement, forbidden token detection, and bounded retry prevention.
- **Human Approval Enforcement**: Verification that agents cannot publish without user approval.
- **Mock Synchronization**: WooCommerce adapter in mock mode and secret masking.
- **REST Endpoints**: FastAPI endpoints for products, runs, reviews, and sync.

Run the test suite:

```bash
cd kilowott_org
python -m pytest backend/tests -v
```

### Frontend Test Suite (Vitest)

```bash
cd kilowott_org/frontend
npm test
```

---

## 📡 Exposed FastAPI Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check and WooCommerce adapter status |
| `GET` | `/api/stats` | Dashboard statistics (total, incomplete, needs review, syncs) |
| `GET` | `/api/products` | List all catalog products |
| `GET` | `/api/products/{id}` | Get product details by ID |
| `GET` | `/api/findings` | Get audit findings (optional `?product_id=...` filter) |
| `GET` | `/api/proposals` | List all proposals generated by agents |
| `POST` | `/api/proposals/{id}/review` | Approve, edit, or reject a proposal |
| `POST` | `/api/agents/runs` | Submit a task to the LangGraph multi-agent pipeline |
| `GET` | `/api/agents/runs` | Get agent execution history and event logs |
| `GET` | `/api/sync/history` | Get WooCommerce synchronization audit log |
| `POST` | `/api/sync` | Manually trigger sync for pending products |

---

## 🔒 Security & Grounding Guarantees

1. **No Secrets to Frontend**: WooCommerce consumer keys and LLM API keys are strictly stored on the server.
2. **Explicit User Approval**: The system enforces that agents can only propose changes in `pending` status. Products are only updated and synced when the user calls `/api/proposals/{id}/review` with `status: "approved"`.
3. **No Hallucinated Specifications**: If technical attributes cannot be verified from existing context or product titles, the Enrichment Agent flags them for human confirmation rather than generating false specifications.
4. **Offline Demonstrability**: The system runs seamlessly without external API keys or WooCommerce store credentials.
