import logging
from typing import Dict, Any, Literal
from langgraph.graph import StateGraph, END
from ..models.pim import AgentEvent, utc_now_iso
from .state import PIMWorkflowState
from .analyst import run_catalog_analyst
from .enricher import run_enrichment_agent
from .quality import run_quality_agent

logger = logging.getLogger("pim.orchestrator")

async def plan_node(state: PIMWorkflowState) -> dict:
    """Orchestrator Planning Phase: analyzes task scope and plans execution sequence."""
    logger.info(f"[Orchestrator] Planning workflow for task: '{state.task}'")

    event = AgentEvent(
        id=f"ev-orch-plan-{len(state.events) + 1}",
        agent="Orchestrator",
        status="completed",
        message=f"Planning execution for task: '{state.task}'. Coordinating Catalog Analyst → Enrichment Agent → Quality Agent.",
        result="Delegated to Catalog Analyst → Enrichment → Quality",
        timestamp=utc_now_iso(),
    )
    return {
        "status": "running",
        "events": state.events + [event],
    }

async def analyst_node(state: PIMWorkflowState) -> dict:
    """Executes Catalog Analyst."""
    return run_catalog_analyst(state)

async def enrich_node(state: PIMWorkflowState) -> dict:
    """Executes Enrichment Agent."""
    return await run_enrichment_agent(state)

async def quality_node(state: PIMWorkflowState) -> dict:
    """Executes deterministic Quality Agent."""
    return run_quality_agent(state)

def route_after_quality(state: PIMWorkflowState) -> Literal["enrichment_agent", "finalize"]:
    """Conditional routing based on Quality Agent validation and bounded retries."""
    if state.needs_retry and state.retry_count <= state.max_retries:
        logger.info(f"[Orchestrator] Routing back to Enrichment Agent for bounded retry (attempt {state.retry_count})")
        return "enrichment_agent"
    return "finalize"

async def finalize_node(state: PIMWorkflowState) -> dict:
    """Finalizes workflow execution, enforces human review checkpoint."""
    logger.info(f"[Orchestrator] Finalizing workflow. Total proposals generated: {len(state.proposals)}")

    event = AgentEvent(
        id=f"ev-orch-fin-{len(state.events) + 1}",
        agent="Orchestrator",
        status="completed",
        message=f"Workflow completed successfully. Generated {len(state.proposals)} validated proposals.",
        result="All changes held in pending status for explicit user approval (enforcing human-in-the-loop)",
        timestamp=utc_now_iso(),
    )

    return {
        "status": "completed",
        "events": state.events + [event],
    }

def build_pim_graph() -> StateGraph:
    """Constructs the LangGraph state machine for multi-agent PIM automation."""
    workflow = StateGraph(PIMWorkflowState)

    workflow.add_node("orchestrator_plan", plan_node)
    workflow.add_node("catalog_analyst", analyst_node)
    workflow.add_node("enrichment_agent", enrich_node)
    workflow.add_node("quality_agent", quality_node)
    workflow.add_node("finalize", finalize_node)

    workflow.set_entry_point("orchestrator_plan")
    workflow.add_edge("orchestrator_plan", "catalog_analyst")
    workflow.add_edge("catalog_analyst", "enrichment_agent")
    workflow.add_edge("enrichment_agent", "quality_agent")

    workflow.add_conditional_edges(
        "quality_agent",
        route_after_quality,
        {
            "enrichment_agent": "enrichment_agent",
            "finalize": "finalize",
        },
    )

    workflow.add_edge("finalize", END)

    return workflow.compile()

pim_graph = build_pim_graph()
