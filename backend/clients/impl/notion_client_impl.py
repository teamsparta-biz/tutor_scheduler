import requests

from clients.notion_client import NotionClient

NOTION_API_VERSION = "2022-06-28"
NOTION_BASE_URL = "https://api.notion.com/v1"


class NotionClientImpl(NotionClient):
    """requests 기반 Notion API 클라이언트"""

    def __init__(self, token: str):
        self._headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Notion-Version": NOTION_API_VERSION,
        }

    async def query_database(self, database_id: str, filters: dict | None = None) -> list[dict]:
        raise NotImplementedError("task 40에서 구현")

    async def get_page(self, page_id: str) -> dict:
        raise NotImplementedError("task 40에서 구현")
