# Isolated private preview deployment

- URL: https://ninezone-pitch-swing-lab-20261118.credin1.chatgpt.site/?showcase=pitch-swing
- Native Sites deployment status: `succeeded`,2026-11-18T02:51:56.749372Z.
- Site: `appgprj_6afd0e25d7e88191be7aebcf60ae1494`
- Deployment: `appgdep_6afd12b619c48191a64b51de338045b1`
- Saved version: `appgprj_6afd0e25d7e88191be7aebcf60ae1494~appgver_10fe5dbe69c88191b8d1891400ebd54c`
- Separate Sites source commit: `07c887d4e7dbb567e3a30763e9a043b8d0ed1866`
- Official repo implementation commit: `06aa22d47c6441d6e45e4dc3cf495299062f12d5`, Draft PR https://github.com/jbseo-commits/9-baseball/pull/124 (stacked on#123).
- Owner-private access rechecked after success: custom policy,1owner,0groups. No public-sharing change and no official game production/main deployment.

The static artifact is the verified Vite build, plus a default-route redirect to pitch-swing and preserved CC0 license/provenance files. A separate new Sites source repository holds those exact static files; the saved tar matches that pushed commit. Environment did not contain Sites helper scripts, so normal Git with the supplied scoped credential (hidden stdin/in-memory header) prepared/pushed it, then native private save/deploy performed publication. Credential expiry during preparation was resolved with a fresh credential for the same Site; no token stored or logged.

## Post-deployment verification limit

Native deployment and private access configuration are confirmed. Actual Chromium navigation to the deployed host failed with `net::ERR_TUNNEL_CONNECTION_FAILED` from this managed environment, before loading the page. The web-open tool also reported the URL inaccessible. This is **not a passing deployed-play check**. Owner should open the link in their signed-in browser. Identical local static build passed the actual input/touch/viewport checks; the hosting redirect was subsequently checked locally. No attempt was made to change network policy or site audience to evade the restriction.

The source implementation remains identical if a subsequent commit only adds this deployment record. Official main stayed `fb8e7b13f043e2c17376138abe6696f48c2d8022`;#123 stayed `dc67424a5bd4039784bb3f12accd351f2f8a55a1`.
