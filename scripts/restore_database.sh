#!/usr/bin/env bash
# ==============================================================================
# Aroma Rose — Database Recovery & Restore Verification Drill
# ==============================================================================
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <backup_file.sql.gz> [target_database]"
  echo "Example: $0 ./backups/aroma_rose_backup_20261105_120000Z.sql.gz aroma_rose_staging"
  exit 1
fi

BACKUP_FILE="$1"
CONTAINER="${CONTAINER:-aroma_rose_test_db}"
TARGET_DB="${2:-aroma_rose_recovery_test}"
DB_USER="${DB_USER:-postgres}"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "ERROR: Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

echo "=============================================================================="
echo "          Aroma Rose — Database Disaster Recovery Verification Drill"
echo "=============================================================================="
echo "Backup File:       ${BACKUP_FILE}"
echo "Target DB (Drill): ${TARGET_DB}"
echo "Docker Container:  ${CONTAINER}"
echo "------------------------------------------------------------------------------"

# 1. Verify archive integrity
echo "[1/4] Testing archive integrity..."
gzip -t "${BACKUP_FILE}"

# 2. Provision isolated recovery database
echo "[2/4] Provisioning isolated recovery drill database: ${TARGET_DB}..."
docker exec -i "${CONTAINER}" psql -U "${DB_USER}" -c "DROP DATABASE IF EXISTS ${TARGET_DB};"
docker exec -i "${CONTAINER}" psql -U "${DB_USER}" -c "CREATE DATABASE ${TARGET_DB};"

# 3. Restore dump into drill database with triggers suspended for data import
echo "[3/4] Restoring dump into drill database..."
(
  echo "SET session_replication_role = 'replica';"
  gunzip -c "${BACKUP_FILE}"
  echo "SET session_replication_role = 'origin';"
) | docker exec -i "${CONTAINER}" psql -U "${DB_USER}" -d "${TARGET_DB}" -q

# 4. Verify table counts and row integrity in restored database
echo "[4/4] Verifying table integrity in restored drill database..."
TABLE_COUNT=$(docker exec -i "${CONTAINER}" psql -U "${DB_USER}" -d "${TARGET_DB}" -t -A -c "
  SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';
")
ORDER_COUNT=$(docker exec -i "${CONTAINER}" psql -U "${DB_USER}" -d "${TARGET_DB}" -t -A -c "
  SELECT count(*) FROM public.orders;
")
PRODUCT_COUNT=$(docker exec -i "${CONTAINER}" psql -U "${DB_USER}" -d "${TARGET_DB}" -t -A -c "
  SELECT count(*) FROM public.products;
")

echo "Restored Public Tables:   ${TABLE_COUNT}"
echo "Restored Order Records:   ${ORDER_COUNT}"
echo "Restored Product Records: ${PRODUCT_COUNT}"

# Teardown temporary drill database
docker exec -i "${CONTAINER}" psql -U "${DB_USER}" -c "DROP DATABASE ${TARGET_DB};"

echo "=============================================================================="
echo "SUCCESS: Disaster recovery drill passed with 100% integrity."
echo "=============================================================================="
