# Restaurant Refactor Notes

This backend still carries legacy code from older hotel/cafe flows. To keep the
running system stable, refactors should happen by tightening the active
restaurant path first instead of rewriting the whole application.

## What is already treated as the active restaurant path

- `app/api/v1/restaurant.py`
- `app/api/v1/endpoints/restaurant_*`
- `app/models/restaurant.py`
- `docker/mysql/init/00-vr-restaurant-only-schema.sql`
- `docker/mysql/init/02-align-restaurant-schema.sql`
- `docker/mysql/init/03-add-restaurant-achievements.sql`

## Current refactor rule

When adding or editing restaurant features:

1. Prefer `restaurant_*` endpoints over legacy `vr_hotel_*` or older cafe paths.
2. Keep the public API under `/api/v1/restaurant/...`.
3. Avoid adding new logic to `models_old.py`, `models_legacy.py`, or
   legacy migration helpers unless you are explicitly fixing legacy data.

## Recommended next steps

1. Split `app/models/restaurant.py` into smaller domain files:
   - `restaurant_core.py`
   - `restaurant_menu.py`
   - `restaurant_marketing.py`
   - `restaurant_content.py`
2. Add restaurant-specific schema modules under `app/schemas/restaurant/`.
3. Move repeated translation/media attachment logic from endpoints into
   dedicated service helpers.
4. Archive or isolate legacy scripts that are no longer part of the active
   restaurant deployment path.
