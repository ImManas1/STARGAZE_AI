def estimate_bortle(lat: float, lon: float) -> int:
    # crude global heuristic:
    # closer to equator + known dense zones → higher light pollution

    # high-density lat bands (approx urban clusters)
    if 10 < lat < 40:
        return 6

    if 40 <= lat <= 60:
        return 5

    # sparse regions
    return 3