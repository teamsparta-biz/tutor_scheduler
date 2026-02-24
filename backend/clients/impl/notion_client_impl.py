import httpx

from clients.notion_client import NotionClient

NOTION_API_VERSION = "2022-06-28"
NOTION_BASE_URL = "https://api.notion.com/v1"


class NotionClientImpl(NotionClient):
    """httpx 기반 비동기 Notion API 클라이언트"""

    def __init__(self, token: str):
        self._headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Notion-Version": NOTION_API_VERSION,
        }

    async def query_database(self, database_id: str, filters: dict | None = None) -> list[dict]:
        url = f"{NOTION_BASE_URL}/databases/{database_id}/query"
        all_results = []
        has_more = True
        start_cursor = None

        async with httpx.AsyncClient(headers=self._headers, timeout=30.0) as client:
            while has_more:
                body: dict = {}
                if filters:
                    body["filter"] = filters
                if start_cursor:
                    body["start_cursor"] = start_cursor

                resp = await client.post(url, json=body)
                resp.raise_for_status()
                data = resp.json()

                all_results.extend(data.get("results", []))
                has_more = data.get("has_more", False)
                start_cursor = data.get("next_cursor")

        return all_results

    async def get_page(self, page_id: str) -> dict:
        url = f"{NOTION_BASE_URL}/pages/{page_id}"
        async with httpx.AsyncClient(headers=self._headers, timeout=30.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            return resp.json()
