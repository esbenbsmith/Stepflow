#!/bin/sh
set -e

if [ ! -f data/stepflow.db ]; then
  echo "No existing database found — running initial sync (this can take several minutes)..."
  npm run sync
else
  echo "Existing database found at data/stepflow.db — skipping initial sync."
fi

# Refresh the data once a day. Keep the DB on a persistent volume so restarts
# don't force a full resync.
(
  while true; do
    sleep 86400
    echo "Running scheduled sync..."
    npm run sync || echo "Scheduled sync failed, will retry next cycle"
  done
) &

exec npm start
