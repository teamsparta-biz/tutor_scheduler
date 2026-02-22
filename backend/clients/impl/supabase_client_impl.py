from supabase import create_client, Client

from clients.supabase_client import SupabaseClient


class SupabaseClientImpl(SupabaseClient):
    """supabase-py 기반 Supabase 클라이언트"""

    def __init__(self, url: str, key: str):
        self._client: Client = create_client(url, key)

    def table(self, table_name: str):
        return self._client.table(table_name)
