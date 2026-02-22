from config import settings
from clients.notion_client import NotionClient
from clients.supabase_client import SupabaseClient
from clients.impl.notion_client_impl import NotionClientImpl
from clients.impl.supabase_client_impl import SupabaseClientImpl


def get_notion_client() -> NotionClient:
    return NotionClientImpl(token=settings.NOTION_TOKEN)


def get_supabase_client() -> SupabaseClient:
    return SupabaseClientImpl(url=settings.SUPABASE_URL, key=settings.SUPABASE_KEY)
