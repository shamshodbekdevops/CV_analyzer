#!/bin/sh
set -e

exec celery -A config worker -l ${CELERY_LOG_LEVEL:-info}
