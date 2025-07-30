#!/bin/bash

export $(grep -v '^#' .env | xargs)

sea generate entity \
  --database-url "$DATABASE_URL" \
  --output-dir src/entity \
  --with-serde both

