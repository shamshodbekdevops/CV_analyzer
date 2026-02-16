from django.core.cache import cache


def build_cache_key(prefix: str, identifier: str) -> str:
    return f"cv_analyzer:{prefix}:{identifier}"


def set_json_cache(key: str, payload: dict, ttl: int) -> None:
    cache.set(key, payload, timeout=ttl)


def get_json_cache(key: str):
    return cache.get(key)
