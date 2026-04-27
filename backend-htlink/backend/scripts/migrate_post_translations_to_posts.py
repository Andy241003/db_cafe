#!/usr/bin/env python3
"""
One-off migration helper: create missing rows in `posts` for `post_translations` entries
that reference non-existent posts. This script is conservative: it runs a dry-run by default
and prints proposed INSERTs. Set APPLY=1 in env to perform changes.

Usage (inside backend container):
  python scripts/migrate_post_translations_to_posts.py --dry-run
  python scripts/migrate_post_translations_to_posts.py --apply

It will attempt to infer feature_id by searching translation text for feature slugs.
If none found, it will pick the first feature for the tenant. It will assign property_id to
first property for the tenant.

Make a DB backup before applying.
"""
import os
import sys
import argparse
from sqlalchemy import create_engine, text

# Load DB connection from environment similar to app core
DB_URL = os.environ.get('DATABASE_URL')
if not DB_URL:
    mysql_user = os.environ.get('MYSQL_USER', 'hotellink360_user')
    mysql_pass = os.environ.get('MYSQL_PASSWORD', 'StrongDBPassword2024!')
    mysql_host = os.environ.get('MYSQL_SERVER', 'db')
    mysql_port = os.environ.get('MYSQL_PORT', '3306')
    mysql_db = os.environ.get('MYSQL_DATABASE', 'hotellink360_db')
    DB_URL = f'mysql+pymysql://{mysql_user}:{mysql_pass}@{mysql_host}:{mysql_port}/{mysql_db}'

engine = create_engine(DB_URL)

parser = argparse.ArgumentParser()
parser.add_argument('--apply', action='store_true', help='Actually perform inserts')
parser.add_argument('--tenant', type=int, default=None, help='Tenant id to restrict to')
args = parser.parse_args()

APPLY = args.apply
TENANT_FILTER = args.tenant

with engine.connect() as conn:
    # Gather distinct post_ids referenced in post_translations
    q = text('SELECT DISTINCT post_id FROM post_translations')
    rows = conn.execute(q).fetchall()
    post_ids = [r[0] for r in rows]
    print(f'Found {len(post_ids)} distinct post_ids in post_translations: {post_ids}')

    # Get existing posts ids
    q = text('SELECT id FROM posts')
    existing = [r[0] for r in conn.execute(q).fetchall()]

    missing = [pid for pid in post_ids if pid not in existing]
    print(f'{len(missing)} missing post records: {missing}')

    if not missing:
        print('Nothing to do.')
        sys.exit(0)

    # Load features and slugs per tenant (we'll consider all tenants or a specific one)
    features = conn.execute(text('SELECT id, tenant_id, slug FROM features')).fetchall()
    features_by_tenant = {}
    for fid, tid, slug in features:
        features_by_tenant.setdefault(tid, []).append({'id': fid, 'slug': slug})

    # Load first property per tenant
    props = conn.execute(text('SELECT id, tenant_id FROM properties ORDER BY id')).fetchall()
    first_prop_by_tenant = {}
    for pid, tid in props:
        first_prop_by_tenant.setdefault(tid, pid)

    # For each missing post id, get its translation(s) to infer data
    proposals = []
    for pid in missing:
        trs = conn.execute(text('SELECT locale, title, content_html FROM post_translations WHERE post_id = :pid'), {'pid': pid}).fetchall()
        if not trs:
            print(f'No translations found for post_id {pid}, skipping')
            continue
        # Use English translation if available else first
        en = next((r for r in trs if r[0] == 'en'), trs[0])
        locale, title, content_html = en
        content = (content_html or '') + ' ' + (title or '')
        content_l = content.lower()

        # Try to infer tenant: look for any feature slug that appears in content and pick its tenant
        inferred_tid = None
        inferred_fid = None
        for tid, feats in features_by_tenant.items():
            for feat in feats:
                if feat['slug'] and feat['slug'].lower() in content_l:
                    inferred_tid = tid
                    inferred_fid = feat['id']
                    break
            if inferred_tid:
                break

        # If still not inferred, pick the most common tenant among features
        if not inferred_tid:
            # choose first tenant that has features
            if features_by_tenant:
                inferred_tid = next(iter(features_by_tenant))
                inferred_fid = features_by_tenant[inferred_tid][0]['id']

        # If tenant filter provided, enforce it (otherwise skip)
        if TENANT_FILTER and inferred_tid and inferred_tid != TENANT_FILTER:
            print(f'Skipping post {pid} inferred tenant {inferred_tid} != filter {TENANT_FILTER}')
            continue

        # property_id fallback
        property_id = first_prop_by_tenant.get(inferred_tid)
        if not property_id:
            # fallback to 1
            property_id = 1

        # slug fallback
        slug = (title or '').lower().replace(' ', '-').replace("'", '')[:120] or f'legacy-post-{pid}'

        proposal = {
            'id': pid,
            'tenant_id': inferred_tid or 1,
            'property_id': property_id,
            'feature_id': inferred_fid or 0,
            'slug': slug,
            'status': 'PUBLISHED',
            'pinned': False
        }
        proposals.append((proposal, trs))

    print('\nProposed inserts:')
    for p, trs in proposals:
        print(p)

    if not proposals:
        print('No proposals generated; abort')
        sys.exit(0)

    if not APPLY:
        print('\nDry-run complete. To apply changes run with --apply')
        sys.exit(0)

    print('\nApplying inserts...')
    for p, trs in proposals:
        try:
            ins = text('INSERT INTO posts (id, tenant_id, property_id, feature_id, slug, status, pinned, created_at, updated_at) VALUES (:id, :tenant_id, :property_id, :feature_id, :slug, :status, :pinned, NOW(), NOW())')
            conn.execute(ins, p)
            print(f'Inserted post id={p["id"]}')
        except Exception as e:
            print(f'Failed to insert post id={p["id"]}: {e}')

    print('Done.')

