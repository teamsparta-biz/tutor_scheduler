from abc import ABC, abstractmethod


class SupabaseClient(ABC):
    """Supabase 호출 인터페이스"""

    @abstractmethod
    def table(self, table_name: str):
        """테이블 쿼리 빌더 반환"""
        ...
