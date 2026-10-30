#!/bin/bash
KEY="AIzaSyCxwS4oCfB4b2vQniNoSjNOq_G_2GvAkdg"
for f in js/config.js js/firebase.js; do
  if [ -f "$f" ]; then
    sed -i "s|$KEY|REDACTED_FIREBASE_API_KEY|g" "$f"
  fi
done
