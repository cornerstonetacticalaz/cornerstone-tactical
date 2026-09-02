(function () {
  "use strict";

  const DELIM = "|||";

  function normalizeImageSrc(src) {
    if (!src) return "";
    src = String(src).trim();
    if (!src) return "";
    // Decap stores public image paths such as /images/gallery/file.jpg.
    // Relative paths are resolved against the current Netlify admin origin.
    return src;
  }

  function buildSummary(caption, imagePath, visibleText) {
    const wrap = document.createElement("span");
    wrap.className = "ct-gallery-summary";

    const src = normalizeImageSrc(imagePath);
    let thumb;
    if (src) {
      thumb = document.createElement("img");
      thumb.className = "ct-gallery-thumb";
      thumb.src = src;
      thumb.alt = "";
      thumb.loading = "lazy";
      thumb.addEventListener("error", function () {
        const fallback = document.createElement("span");
        fallback.className = "ct-gallery-thumb-fallback";
        fallback.textContent = "Photo";
        thumb.replaceWith(fallback);
      }, { once: true });
    } else {
      thumb = document.createElement("span");
      thumb.className = "ct-gallery-thumb-fallback";
      thumb.textContent = "Photo";
    }

    const text = document.createElement("span");
    text.className = "ct-gallery-summary-text";

    const title = document.createElement("span");
    title.className = "ct-gallery-caption";
    title.textContent = (caption || "Gallery Photo").trim();

    const status = document.createElement("span");
    const isVisible = String(visibleText).trim().toLowerCase() !== "false";
    status.className = "ct-gallery-status" + (isVisible ? "" : " is-hidden");
    status.textContent = isVisible ? "Shown on website" : "Hidden from website";

    text.appendChild(title);
    text.appendChild(status);
    wrap.appendChild(thumb);
    wrap.appendChild(text);
    return wrap;
  }

  function enhanceSummaries() {
    if (!document.body) return;

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (node) {
          if (!node.nodeValue || !node.nodeValue.includes(DELIM)) {
            return NodeFilter.FILTER_REJECT;
          }
          if (node.parentElement && node.parentElement.closest(".ct-gallery-summary")) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const matches = [];
    let node;
    while ((node = walker.nextNode())) matches.push(node);

    matches.forEach(function (textNode) {
      const raw = textNode.nodeValue.trim();
      const parts = raw.split(DELIM);
      if (parts.length < 3) return;

      const caption = parts[0];
      const imagePath = parts[1];
      const visibleText = parts.slice(2).join(DELIM);

      const summary = buildSummary(caption, imagePath, visibleText);
      textNode.parentNode.replaceChild(summary, textNode);
    });
  }

  let scheduled = false;
  function scheduleEnhance() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(function () {
      scheduled = false;
      enhanceSummaries();
    });
  }

  window.addEventListener("load", function () {
    scheduleEnhance();
    const observer = new MutationObserver(scheduleEnhance);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true
    });
  });
})();
