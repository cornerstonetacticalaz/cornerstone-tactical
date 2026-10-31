const menu = document.querySelector(".menu-toggle");
const nav = document.querySelector("nav");

menu.addEventListener("click", () => {
    nav.classList.toggle("show");
});

document.querySelectorAll("nav a").forEach(link => {
    link.addEventListener("click", () => {
        nav.classList.remove("show");
    });
});

document.querySelectorAll(".faq-question").forEach(button => {
    button.addEventListener("click", () => {
        const answer = button.nextElementSibling;
        answer.classList.toggle("open");
    });
});

// Shop Designs gallery. Catalog is maintained in data/shop.json.
(async () => {
  const grid = document.getElementById('shop-grid');
  if (!grid) return;
  const modal = document.getElementById('shop-modal');
  const count = document.getElementById('shop-count');
  let products;
  try {
    if (location.protocol === 'file:' && Array.isArray(window.CORNERSTONE_SHOP_PREVIEW)) {
      products = window.CORNERSTONE_SHOP_PREVIEW;
    } else {
      const response = await fetch('data/shop.json', {cache: 'no-cache'});
      if (!response.ok) throw new Error('Catalog HTTP ' + response.status);
      products = await response.json();
    }
    if (!Array.isArray(products)) throw new Error('Catalog must be an array');
  } catch (error) {
    console.error('Unable to load shop catalog:', error);
    count.textContent = 'DESIGNS UNAVAILABLE';
    grid.textContent = 'Designs could not be loaded. Please try again shortly.';
    return;
  }
  // Only the three confirmed AK designs offer AK. Other designs currently offer PMAG choices.
  const options = [{id:'556',label:'5.56 PMAG',price:30},{id:'300',label:'.300 BLK PMAG',price:40},{id:'ak',label:'AK magazine',price:40}];
  let lastFocus = null;
  // The engraving appearance disclaimer remains visibly displayed on the page.
  // Customers can request a design without an additional acknowledgment step.
  function confirmInquiry(product, type) {
    if (!product.supportedMagazines.includes(type)) return;
    inquiry(product, type);
  }
  const money = n => '$' + n.toFixed(2);

  // Multi-design inquiry cart. No payment processing or online checkout.
  const cart = new Map();
  const cartItems = document.getElementById('order-items');
  const cartSend = document.getElementById('order-send');
  const shippingState = document.getElementById('order-state');
  function validShippingState() {
    return !!shippingState.value && Array.from(shippingState.options).some(option => option.value === shippingState.value && !option.disabled);
  }
  function updateShippingState() {
    cartSend.disabled = cart.size === 0 || !validShippingState();
  }
  shippingState.addEventListener('change', updateShippingState);
  shippingState.addEventListener('input', updateShippingState);
  function renderCart() {
    cartItems.replaceChildren();
    let units = 0, subtotal = 0;
    for (const [key,item] of cart) {
      const opt = options.find(o => o.id === item.type);
      units += item.qty; subtotal += opt.price * item.qty;
      const row = document.createElement('div'); row.className = 'order-row';
      const photo = document.createElement('img'); photo.src = item.product.image; photo.alt = item.product.name; photo.loading = 'lazy';
      const info = document.createElement('div'); info.className = 'order-info';
      const title = document.createElement('strong'); title.textContent = item.product.name;
      const subtitle = document.createElement('span'); subtitle.textContent = opt.label + ' · ' + money(opt.price) + ' each';
      info.append(title, subtitle);
      const qtyLabel = document.createElement('label'); qtyLabel.textContent = 'Qty ';
      const qty = document.createElement('input'); qty.type = 'number'; qty.min = '1'; qty.max = '99'; qty.step = '1'; qty.value = String(item.qty);
      qty.setAttribute('aria-label', 'Quantity for ' + item.product.name + ', ' + opt.label);
      qty.addEventListener('change', () => {
        const n = Number(qty.value);
        if (!Number.isInteger(n) || n < 1 || n > 99) { qty.value = String(item.qty); return; }
        item.qty = n; renderCart();
      });
      qtyLabel.append(qty);
      const linePrice = document.createElement('strong'); linePrice.className = 'order-line-price'; linePrice.textContent = money(opt.price * item.qty);
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'order-remove'; remove.textContent = 'Remove';
      remove.setAttribute('aria-label', 'Remove ' + item.product.name + ', ' + opt.label);
      remove.addEventListener('click', () => { cart.delete(key); renderCart(); });
      row.append(photo, info, qtyLabel, linePrice, remove); cartItems.append(row);
    }
    document.getElementById('order-count').textContent = '(' + units + ')';
    const floatingCount = document.getElementById('floating-cart-count');
    const floatingCart = document.getElementById('floating-cart');
    floatingCount.textContent = String(units);
    floatingCart.setAttribute('aria-label', 'View order summary, ' + units + (units === 1 ? ' item' : ' items'));
    floatingCart.classList.toggle('has-items', units > 0);
    document.getElementById('order-empty').hidden = cart.size > 0;
    document.getElementById('order-subtotal').textContent = 'Subtotal: ' + money(subtotal);
    updateShippingState();
  }
  function addDesign(product, type) {
    if (!product.supportedMagazines.includes(type)) return;
    const key = product.id + '|' + type;
    if (cart.has(key)) cart.get(key).qty = Math.min(99, cart.get(key).qty + 1);
    else cart.set(key, {product, type, qty: 1});
    renderCart();
    const feedback = document.getElementById('cart-feedback');
    feedback.textContent = product.name + ' added to cart';
    feedback.classList.add('visible');
    window.clearTimeout(addDesign.feedbackTimer);
    addDesign.feedbackTimer = window.setTimeout(() => feedback.classList.remove('visible'), 2200);
  }
  cartSend.addEventListener('click', () => {
    if (!cart.size || !shippingState.value || !validShippingState()) { updateShippingState(); return; }
    const form = document.querySelector('#contact form');
    const message = form?.querySelector('textarea[name="message"]');
    if (!message) return;
    const lines = ['MULTI-DESIGN ENGRAVING ORDER REQUEST', ''];
    let units = 0, subtotal = 0, index = 0;
    for (const item of cart.values()) {
      const opt = options.find(o => o.id === item.type);
      index++; units += item.qty; subtotal += opt.price * item.qty;
      lines.push(index + '. ' + item.product.name + ' (' + item.product.id + ')',
        'Photo: ' + new URL(item.product.image, document.baseURI).href,
        'Magazine: ' + opt.label, 'Quantity: ' + item.qty,
        'Unit price: ' + money(opt.price), 'Line total: ' + money(opt.price * item.qty), '');
    }
    lines.push('Shipping state: ' + shippingState.value, 'Total magazines: ' + units, 'Subtotal: ' + money(subtotal),
      'Shipping: calculated separately', '',
      'Please confirm availability, compatibility, shipping eligibility and final total before payment.');
    for (const field of ['design_reference','design_photo_url','requested_magazine','quoted_price'])
      form.querySelector('input[name="' + field + '"]')?.remove();
    message.value = lines.join('\n');
    let shippingField = form.querySelector('input[name="order_shipping_state"]');
    if (!shippingField) { shippingField = document.createElement('input'); shippingField.type = 'hidden'; shippingField.name = 'order_shipping_state'; form.append(shippingField); }
    shippingField.value = shippingState.value;
    document.getElementById('contact').scrollIntoView({behavior:'smooth'});
    message.focus({preventScroll:true});
  });
  const orderContactForm = document.querySelector('#contact form');
  orderContactForm?.addEventListener('submit', (event) => {
    const orderStateField = orderContactForm.querySelector('input[name="order_shipping_state"]');
    if (!orderStateField) return;
    if (!shippingState.value || !validShippingState() || orderStateField.value !== shippingState.value) {
      event.preventDefault();
      updateShippingState();
      document.getElementById('order-summary').scrollIntoView({behavior:'smooth',block:'start'});
      shippingState.focus({preventScroll:true});
    }
  });
  renderCart();

  function populateSelect(select, product) {
    const placeholder = new Option('Select magazine type', '');
    select.add(placeholder);
    for (const o of options.filter(o => product.supportedMagazines.includes(o.id))) select.add(new Option(o.label + ' — ' + money(o.price), o.id));
  }
  function updatePrice(select, display) {
    const choice = options.find(o => o.id === select.value);
    display.textContent = choice ? money(choice.price) + ' + shipping' : 'Select a magazine for pricing';
  }
  function inquiry(product, type) {
    const choice = options.find(o => o.id === type);
    if (!choice) return;
    const message = document.querySelector('#contact textarea[name="message"]');
    const imageUrl = new URL(product.image, document.baseURI).href;
    if (message) message.value = 'ENGRAVING DESIGN REQUEST\n' +
      'Design reference: ' + product.id + '\n' +
      'Design photo: ' + imageUrl + '\n' +
      'Magazine: ' + choice.label + '\n' +
      'Price: ' + money(choice.price) + ' plus shipping\n\n' +
      'Please confirm compatibility, availability, and shipping eligibility.';
    // Formspree receives a direct photo URL and reference ID with the inquiry.
    const contactForm = document.querySelector('#contact form');
    if (contactForm) {
      const setField = (field, value) => {
        let input = contactForm.querySelector('input[name="' + field + '"]');
        if (!input) { input = document.createElement('input'); input.type = 'hidden'; input.name = field; contactForm.append(input); }
        input.value = value;
      };
      setField('design_reference', product.id);
      setField('design_photo_url', imageUrl);
      setField('requested_magazine', choice.label);
      setField('quoted_price', money(choice.price) + ' plus shipping');
    }
    document.getElementById('contact')?.scrollIntoView({behavior:'smooth'});
    message?.focus({preventScroll:true});
  }
  function openPreview(product) {
    lastFocus = document.activeElement;
    modal.querySelector('.shop-modal-image').src = product.image;
    modal.querySelector('.shop-modal-image').alt = 'Selected engraved magazine design';
    modal.querySelector('.shop-modal-title').textContent = 'Engraving preview';
    modal.querySelector('.shop-modal-description').textContent = product.description || 'Magazine compatibility and shipping eligibility will be confirmed before payment.';
    modal.querySelector('.shop-modal-order').textContent = 'Return to design selection ↗';
    modal.querySelector('.shop-modal-order').href = '#gallery';
    modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
    document.body.classList.add('shop-modal-open'); modal.querySelector('.shop-modal-close').focus();
  }
  function closePreview() {
    modal.classList.remove('open'); modal.setAttribute('aria-hidden','true');
    document.body.classList.remove('shop-modal-open');
    modal.querySelector('.shop-modal-image').removeAttribute('src'); lastFocus?.focus();
  }
  count.textContent = products.length + (products.length === 1 ? ' DESIGN' : ' DESIGNS');
  grid.replaceChildren();
  for (const product of products) {
    const card = document.createElement('article'); card.className = 'shop-card';
    const photo = document.createElement('button'); photo.type = 'button'; photo.className = 'shop-photo';
    photo.setAttribute('aria-label','Enlarge engraving design');
    const img = document.createElement('img'); img.src = product.image; img.alt = 'Engraved magazine design photo'; img.loading = 'lazy';
    img.addEventListener('error', () => { img.alt = 'Design photo unavailable'; card.classList.add('shop-image-missing'); });
    photo.append(img); photo.addEventListener('click', () => openPreview(product));
    const detail = document.createElement('div'); detail.className = 'shop-card-detail';
    const select = document.createElement('select'); select.className = 'shop-mag-select'; select.setAttribute('aria-label','Magazine type for selected design');
    populateSelect(select, product);
    const price = document.createElement('strong'); price.className = 'shop-dynamic-price';
    updatePrice(select,price); select.addEventListener('change', () => updatePrice(select,price));
    const order = document.createElement('button'); order.type = 'button'; order.className = 'shop-inquire'; order.textContent = 'ADD TO ORDER +'; order.disabled = true;
    select.addEventListener('change', () => { order.disabled = !select.value; });
    order.addEventListener('click', () => addDesign(product,select.value));
    detail.append(select,price,order); card.append(photo,detail); grid.append(card);
  }
  modal.querySelector('.shop-modal-close').addEventListener('click',closePreview);
  modal.querySelector('.shop-modal-order').addEventListener('click',closePreview);
  modal.addEventListener('click',e => { if (e.target === modal) closePreview(); });
  document.addEventListener('keydown',e => { if (modal.classList.contains('open') && e.key === 'Escape') closePreview(); });
})();

// Custom design inquiry: reuse the site's existing Formspree contact form. No payments are collected here.
(() => {
  const form = document.getElementById('custom-design-form');
  const contact = document.querySelector('#contact form');
  if (!form || !contact) return;
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const magazine = document.getElementById('custom-magazine').value;
    const idea = document.getElementById('custom-idea').value.trim();
    const message = contact.querySelector('textarea[name="message"]');
    if (!message) return;
    for (const field of ['design_reference','design_photo_url','requested_magazine','quoted_price']) contact.querySelector('input[name="' + field + '"]')?.remove();
    message.value = 'CUSTOM ENGRAVING DESIGN REQUEST\n' +
      'Preferred magazine: ' + magazine + '\n' +
      'Design concept: ' + idea + '\n\n' +
      'I acknowledge the $10 design deposit is due before design work begins and is credited toward my magazine purchase. The deposit is nonrefundable after work begins if I change my mind, reject an achievable design, or stop responding. If Cornerstone Tactical cannot reasonably fulfill my original design requirements, the deposit is refunded in full. No engraving begins before design approval and final payment.';
    document.getElementById('contact').scrollIntoView({behavior:'smooth',block:'start'});
    message.focus({preventScroll:true});
  });
})();

// Age confirmation shown before the website can be used.
(() => {
  const gate = document.getElementById('age-gate');
  if (!gate) return;
  const accepted = (() => { try { return localStorage.getItem('ct-age-confirmed') === 'yes'; } catch { return false; } })();
  function dismiss() { gate.hidden = true; document.body.classList.remove('age-gate-active'); }
  if (accepted) { dismiss(); return; }
  document.body.classList.add('age-gate-active');
  gate.hidden = false;
  document.getElementById('age-yes').addEventListener('click', () => {
    try { localStorage.setItem('ct-age-confirmed', 'yes'); } catch {}
    dismiss();
  });
  document.getElementById('age-no').addEventListener('click', () => { window.location.assign('https://www.google.com/'); });
})();
