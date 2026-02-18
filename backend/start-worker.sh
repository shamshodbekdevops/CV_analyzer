#!/bin/sh
set -e

export C_FORCE_ROOT=${C_FORCE_ROOT:-true}
CELERY_CONCURRENCY=${CELERY_CONCURRENCY:-2}
CELERY_POOL=${CELERY_POOL:-prefork}

exec celery -A config worker \
  -l ${CELERY_LOG_LEVEL:-info} \
  --pool "${CELERY_POOL}" \
  --concurrency "${CELERY_CONCURRENCY}"
