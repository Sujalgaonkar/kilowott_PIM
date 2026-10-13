import logging
import asyncio
from typing import Optional
from ..catalog.store import store
from ..models.pim import AgentRun, AgentEvent, utc_now_iso
from ..agents.state import PIMWorkflowState
from ..agents.orchestrator import pim_graph

logger = logging.getLogger("pim.workflow_runner")

async def execute_pim_task(run_id: str, task: str) -> None:
    """
    Executes a PIM automation task asynchronously using the LangGraph agent graph.
    Updates run events in the store and appends generated proposals in pending status.
    Strictly prevents auto-publishing to WooCommerce without user approval.
    """
    logger.info(f"Starting execution of run {run_id} for task: '{task}'")
    store.update_run_status(run_id, "running")

    # Initial queued event
    store.add_event(
        run_id,
        AgentEvent(
            id=f"ev-start-{run_id}",
            agent="Orchestrator",
            status="running",
            message=f"Task received: '{task}'. Initializing LangGraph state graph.",
            timestamp=utc_now_iso(),
        )
    )

    try:
        # Load active products from store
        products = store.get_products()

        # Build initial state
        initial_state = PIMWorkflowState(
            task=task,
            run_id=run_id,
            products=products,
            events=[],
            retry_count=0,
            max_retries=2,
            needs_retry=False,
            status="running"
        )

        # Run LangGraph pipeline
        result = await pim_graph.ainvoke(initial_state)

        # Sync events from state graph to the store's run record
        generated_events = result.get("events", [])
        for ev in generated_events:
            store.add_event(run_id, ev)

        # Add newly generated proposals to store in pending status (awaiting human review)
        generated_proposals = result.get("proposals", [])
        for prop in generated_proposals:
            store.add_proposal(prop)

        store.update_run_status(run_id, "completed")
        logger.info(f"Run {run_id} completed successfully. {len(generated_proposals)} proposals queued.")

    except Exception as e:
        logger.exception(f"Run {run_id} encountered an error: {e}")
        store.add_event(
            run_id,
            AgentEvent(
                id=f"ev-err-{run_id}",
                agent="Orchestrator",
                status="failed",
                message=f"Execution halted: {str(e)}",
                result=str(e),
                timestamp=utc_now_iso(),
            )
        )
        store.update_run_status(run_id, "failed")

def start_agent_task_background(task: str) -> AgentRun:
    """Creates a run entry and dispatches execution into the asyncio event loop."""
    run = store.create_run(task=task, simulated=False)
    asyncio.create_task(execute_pim_task(run.id, task))
    return run
