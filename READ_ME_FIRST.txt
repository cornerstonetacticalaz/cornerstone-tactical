CORRECTED ISOLATED PATCH — ONLY TWO WEBSITE FILES

Replace ONLY:
1. admin/gallery-admin.js
2. script.js

DO NOT replace styles.css, index.html, config.yml, gallery.json, images, or anything else.

Why the previous patch failed:
- The admin badge still read the Decap collapsed-row summary value. That summary is stale after our custom JS replaces Decap's text, so changing true/false parsing did not solve the root problem.
- This version reads the actually deployed data/gallery.json and matches status by image path.

Mobile:
- The previous code only checked finger movement.
- This version also checks actual page scroll distance before allowing the lightbox to open.
