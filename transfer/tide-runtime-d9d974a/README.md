Transfer representation only. No runtime/source changes or deployment.

Retrieve dist-manifest.json and overlay-manifest.json, then numbered chunks in order. Validate each chunk SHA256, concatenate ASCII, strip whitespace, decode Base64 and validate overlay SHA256. Extract ZIP paths into a staging dist root. Reuse V3 files ONLY if their SHA256 and byte length match dist-manifest.json. Verify all 632 final files before staging. Remove obsolete paths only inside staging. Keep the original V3 intact.

If a final path is missing or mismatched, request that exact path plus expected SHA256 for targeted extraction from the already committed source ZIP. The ZIP is the authoritative byte source; source assets may differ after bundling. Do not rebuild, guess filenames, or treat same names as proof. No full ZIP chunks are included.
