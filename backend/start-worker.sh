#!/bin/sh
set -e

export C_FORCE_ROOT=${C_FORCE_ROOT:-true}

exec celery -A config worker -l ${CELERY_LOG_LEVEL:-info}
