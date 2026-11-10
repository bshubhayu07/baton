import sys
import asyncio
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

import httpx
from app.main import app

async def run_tests():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        print("Testing /api/health...")
        r = await client.get("/api/health")
        print(f"Health status: {r.status_code}, response: {r.json()}")
        assert r.status_code == 200

        print("Testing /api/auth/demo-users...")
        r = await client.get("/api/auth/demo-users")
        print(f"Demo users count: {len(r.json())}")
        assert len(r.json()) >= 4
        token_lead = next(u["token"] for u in r.json() if "lead" in u["email"])

        headers = {"Authorization": f"Bearer {token_lead}"}

        print("Testing /api/projects...")
        r = await client.get("/api/projects", headers=headers)
        projects = r.json()
        print(f"Projects found: {len(projects)}")
        assert len(projects) > 0
        project_id = projects[0]["id"]
        print(f"Project ID: {project_id}, Name: {projects[0]['name']}")

        print("Testing /api/projects/{id}/claims...")
        r = await client.get(f"/api/projects/{project_id}/claims", headers=headers)
        claims = r.json()
        print(f"Claims count: {len(claims)}")
        assert len(claims) >= 5

        print("Testing /api/projects/{id}/graph...")
        r = await client.get(f"/api/projects/{project_id}/graph", headers=headers)
        graph_data = r.json()
        print(f"Graph nodes: {len(graph_data['nodes'])}, edges: {len(graph_data['edges'])}")
        assert len(graph_data['nodes']) > 0

        print("Testing /api/projects/{id}/ledger/verify...")
        r = await client.get(f"/api/projects/{project_id}/ledger/verify", headers=headers)
        ledger_report = r.json()
        print(f"Ledger report: {ledger_report}")
        assert ledger_report["valid"] is True

        print("Testing /api/projects/{id}/handover...")
        r = await client.get(f"/api/projects/{project_id}/handover", headers=headers)
        handover = r.json()
        print(f"Handover generated for: {handover['generated_for_role']}, decisions: {len(handover['decisions'])}")

        print("\nALL BACKEND API SMOKE TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    asyncio.run(run_tests())
