# V6.3 game camera calibration checkpoint
# Use the local downloadable validate_v63_game_camera.py for 181-frame proxy projections.
# Verified CSS: v14-portrait-master.css portrait .bp-pitcher left 67.4u bottom 78.4u height 32u;
# short portrait left 73.4u height 24u. Game sprite stance points are in
# src/duel/pitcher-stance.json, applied by src/duel/BallparkActors.jsx.
#
# Important: This is NOT a certified game-camera integration. The actual sprite
# bounds, CSS computed --u, DOM offsets, and Pixi texture anchors must be read
# in-browser before converting a 3D rig into a game sprite anchor.
#
# Local diagnostic: right/left projected skeleton at 390x844 and 412x743:
# 181 frames each, 0 off-screen and 0 bounding-box overlap with zone,
# under an ASSUMED fixed sprite width 32u and approximate --u.
# Landscape remains untested because the portrait CSS rule does not apply.
