from supabase import create_client, Client

from app.core.config import get_settings

_supabase: Client | None = None


def get_supabase() -> Client:
    """
    Returns a singleton Supabase client configured with the SERVICE ROLE key.
    WARNING: service role bypasses RLS. Only use this on the backend.
    """
    global _supabase
    if _supabase is None:
        settings = get_settings()
        _supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    return _supabase
