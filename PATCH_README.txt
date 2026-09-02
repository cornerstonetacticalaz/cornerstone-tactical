ISOLATED PATCH ONLY — DO NOT REPLACE THE REST OF THE SITE

Locked baseline:
Cornerstone_Tactical_Gallery_Admin_Thumbnail_View.zip

Changed files ONLY:
1. admin/gallery-admin.js
   - Fixes false/blank Decap boolean rendering so hidden items display "Hidden from website".

2. script.js
   - Prevents a scroll/swipe on mobile from being treated as a tap that opens the lightbox.

3. styles.css
   - Adds touch-action: pan-y to gallery items so vertical mobile scrolling is handled cleanly.

No other files were changed.
Do NOT upload index.html, legal.html, admin/config.yml, data/gallery.json, images/, or any other site files for this patch.
