# Leaf Content Guard — build identity

Version: 0.0.1.

A new RSA-2048 key pair is stored locally in `.keys/leaf-content-guard.pem` (private) and `.keys/leaf-content-guard-public.pem` (public). The private file is permission 0600, its directory is 0700, and `.keys/.gitignore` excludes all files in that directory from Git. Keep the private key for any locally signed CRX releases. It is not a Chrome Web Store signing key.

Only the Base64 SPKI public key is embedded in `src/manifest.json` under `key`. The local unpacked extension ID is `onepdnicpfnnagihkmmpaadelmbiedmj`. Build and package scripts continue to copy only explicitly selected build inputs, excluding `.keys/` and private material.

Page events and registered script IDs now use `leaf-content-guard` consistently across content scripts, page scripts and UI. Saved settings retain their existing structure.

Chrome Web Store identity comes from a new item in Developer Dashboard. Once that item exists, use its Package → View public key value in the manifest to align the local extension ID with the store item ID. The locally generated key does not establish a store listing or its final ID.

Reference: https://developer.chrome.com/docs/extensions/reference/manifest/key

## Store upload packaging

The new-item upload on 22 November 2026 rejected the package with `key field is not allowed in manifest.` The package script now uses a temporary staging copy and removes the manifest `key` from the Store ZIP. The source manifest and `dist/extension` retain the public key for local development. No private key is included in either build. All other Store ZIP files match dist.
