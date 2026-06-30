"""
Delete all specifications in the configured Graphlit environment.

Usage:
    python delete_all_specs.py            # dry-run, lists what would be deleted
    python delete_all_specs.py --confirm   # actually deletes them

WARNING: This is destructive and irreversible. Any conversations/agents
referencing a deleted specification will break. Double-check you're
pointed at the right GRAPHLIT_ENVIRONMENT_ID before running with --confirm.
"""
import sys
import os
import asyncio
import argparse

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
from dotenv import load_dotenv
load_dotenv(override=True)
from graphlit import Graphlit

env_id = os.getenv("GRAPHLIT_ENVIRONMENT_ID")
org_key = os.getenv("GRAPHLIT_ORGANIZATION_ID") or os.getenv("GRAPHLIT_ORGANIZATION_KEY")
jwt_secret = os.getenv("GRAPHLIT_JWT_SECRET")

if not all([env_id, org_key, jwt_secret]):
    raise ValueError(f"Missing Graphlit config — env_id={env_id}, org_key={org_key}, jwt_secret={'set' if jwt_secret else 'MISSING'}")

graphlit = Graphlit(
    environment_id=env_id,
    organization_id=org_key,
    jwt_secret=jwt_secret,
)


async def list_all_spec_ids() -> list[str]:
    """Page through all specifications and collect their ids."""
    spec_ids = []
    offset = 0
    page_size = 100

    while True:
        response = await graphlit.client.query_specifications(
            offset=offset,
            limit=page_size,
        )
        results = response.specifications.results if response.specifications else None
        if not results:
            break

        for spec in results:
            spec_ids.append(spec.id)

        if len(results) < page_size:
            break
        offset += page_size

    return spec_ids


async def delete_all_specs(confirm: bool = False):
    spec_ids = await list_all_spec_ids()

    if not spec_ids:
        print("No specifications found.")
        return

    print(f"Found {len(spec_ids)} specification(s):")
    for sid in spec_ids:
        print(f"  - {sid}")

    if not confirm:
        print("\nDry run only. Re-run with --confirm to actually delete these.")
        return

    deleted, failed = 0, 0
    for sid in spec_ids:
        try:
            await graphlit.client.delete_specification(id=sid)
            print(f"[DELETED] {sid}")
            deleted += 1
        except Exception as e:
            print(f"[FAILED] {sid}: {e}")
            failed += 1

    print(f"\nDone. Deleted {deleted}, failed {failed}, total {len(spec_ids)}.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Delete all Graphlit specifications.")
    parser.add_argument("--confirm", action="store_true", help="Actually perform deletion (default is dry-run).")
    args = parser.parse_args()

    asyncio.run(delete_all_specs(confirm=args.confirm))