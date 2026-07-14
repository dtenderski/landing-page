#!/bin/bash
VITE_CONFIG="node_modules/vite/dist/node/chunks/config.js"
if [ -f "$VITE_CONFIG" ]; then
  sed -i 's/if (!importer) opts.logger.warnOnce("\\nA PostCSS plugin did not pass/if (false \&\& !importer) opts.logger.warnOnce("\\nA PostCSS plugin did not pass/' "$VITE_CONFIG"
fi
