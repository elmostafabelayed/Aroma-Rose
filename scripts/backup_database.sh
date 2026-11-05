#!/usr/bin/env bash
# ==============================================================================
# Aroma Rose — Database Backup Script (PostgreSQL / Supabase)
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date -u +"%Y%m%d_%H%M%SZ")
BACKUP_FILE="${BACKUP_DIR}/aroma_rose_backup_${TIMESTAMP}.sql.gz"

CONTAINER="${CONTAINER:-aroma_rose_test_db}"
DB_NAME="${DB_NAME:-aroma_rose_test}"
DB_USER="${DB_USER:-postgres}"

mkdir -p "${BACKUP_DIR}"

echo "=============================================================================="
echo "          Aroma Rose — Production Database Backup Utility"
echo "=============================================================================="
echo "Timestamp:    ${TIMESTAMP}"
echo "Target DB:    ${DB_NAME}"
echo "Destination:  ${BACKUP_FILE}"
echo "------------------------------------------------------------------------------"

# Perform compressed PostgreSQL dump
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
  echo "[1/3] Executing pg_dump via Docker container '${CONTAINER}'..."
  docker exec -i "${CONTAINER}" pg_dump -U "${DB_USER}" --clean --if-exists --no-owner --no-privileges "${DB_NAME}" | gzip -9 > "${BACKUP_FILE}"
else
  echo "[1/3] Executing local pg_dump using DATABASE_URL..."
  pg_dump "${DATABASE_URL}" --clean --if-exists --no-owner --no-privileges | gzip -9 > "${BACKUP_FILE}"
fi

# Verify archive integrity
echo "[2/3] Verifying gzip archive integrity..."
gzip -t "${BACKUP_FILE}"

FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[3/3] Backup archive verified successfully: ${BACKUP_FILE} (${FILE_SIZE})"

# Retention policy: Remove backups older than 30 days
find "${BACKUP_DIR}" -type f -name "aroma_rose_backup_*.sql.gz" -mtime +30 -delete 2>/dev/null || true

echo "=============================================================================="
echo "SUCCESS: Database backup completed and verified."
echo "=============================================================================="

