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
    const response = await fetch('data/shop.json', {cache: 'no-cache'});
    if (!response.ok) throw new Error('Catalog HTTP ' + response.status);
    products = await response.json();
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
  const cart = new Map();
  const moneyCart = n => '
  // The engraving appearance disclaimer remains visibly displayed on the page.
  // Customers can request a design without an additional acknowledgment step.
  function confirmInquiry(product, type) {
    if (!product.supportedMagazines.includes(type)) return;
    inquiry(product, type);
  }
  const money = n => '$' + n.toFixed(2);
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
    order.addEventListener('click', () => addToCart(product,select.value));
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
    for (const field of ['design_reference','design_photo_url','requested_magazine','quoted_price']) contact.querySelector('input[name= + field + ]')?.remove();
    message.value = 'CUSTOM ENGRAVING DESIGN REQUEST\n' +
      'Preferred magazine: ' + magazine + '\n' +
      'Design concept: ' + idea + '\n\n' +
      'I acknowledge the $10 design deposit is due before design work begins and is credited toward my magazine purchase. The deposit is nonrefundable after work begins if I change my mind, reject an achievable design, or stop responding. If Cornerstone Tactical cannot reasonably fulfill my original design requirements, the deposit is refunded in full. No engraving begins before design approval and final payment.';
    document.getElementById('contact').scrollIntoView({behavior:'smooth',block:'start'});
    message.focus({preventScroll:true});
  });
})();
 + n.toFixed(2);
  const cartBox = document.getElementById('cart-items');
  const cartSend = document.getElementById('cart-send');
  function drawCart() {
    cartBox.replaceChildren();
    let units=0, total=0;
    for(const [key,item] of cart){
      const opt=options.find(o=>o.id===item.type);
      units+=item.qty;total+=item.qty*opt.price;
      const row=document.createElement('div');row.className='cart-row';
      const img=document.createElement('img');img.src=item.product.image;img.alt=item.product.name;
      const info=document.createElement('div');info.className='cart-info';
      const name=document.createElement('strong');name.textContent=item.product.name;
      const detail=document.createElement('span');detail.textContent=opt.label+' · '+moneyCart(opt.price)+' each';info.append(name,detail);
      const label=document.createElement('label');label.textContent='Qty ';
      const qty=document.createElement('input');qty.type='number';qty.min='1';qty.max='99';qty.value=String(item.qty);qty.setAttribute('aria-label','Quantity for '+item.product.name);
      qty.addEventListener('change',()=>{const n=Number(qty.value);if(!Number.isInteger(n)||n<1||n>99){qty.value=item.qty;return;}item.qty=n;drawCart();});label.append(qty);
      const price=document.createElement('strong');price.textContent=moneyCart(item.qty*opt.price);
      const remove=document.createElement('button');remove.type='button';remove.textContent='Remove';remove.addEventListener('click',()=>{cart.delete(key);drawCart();});
      row.append(img,info,label,price,remove);cartBox.append(row);
    }
    document.getElementById('cart-count').textContent='('+units+')';
    document.getElementById('cart-empty').hidden=cart.size>0;
    document.getElementById('cart-total').textContent='Subtotal: '+moneyCart(total);
    cartSend.disabled=cart.size===0;
  }
  function addToCart(product,type){
    if(!product.supportedMagazines.includes(type))return;
    const key=product.id+'|'+type;
    if(cart.has(key))cart.get(key).qty=Math.min(99,cart.get(key).qty+1);
    else cart.set(key,{product,type,qty:1});
    drawCart();
    document.getElementById('shop-cart').scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  cartSend.addEventListener('click',()=>{
    if(!cart.size)return;
    const form=document.querySelector('#contact form'),message=form?.querySelector('textarea[name="message"]');
    if(!message)return;
    let total=0,units=0,n=0;
    const lines=['MULTI-DESIGN ENGRAVING ORDER REQUEST',''];
    for(const item of cart.values()){
      const opt=options.find(o=>o.id===item.type);n++;units+=item.qty;total+=item.qty*opt.price;
      lines.push(n+'. '+item.product.name+' ('+item.product.id+')','Photo: '+new URL(item.product.image,document.baseURI).href,'Magazine: '+opt.label,'Quantity: '+item.qty,'Unit price: '+moneyCart(opt.price),'Line total: '+moneyCart(item.qty*opt.price),'');
    }
    lines.push('Total magazines: '+units,'Subtotal: '+moneyCart(total),'Shipping: additional','','Please confirm availability, compatibility and shipping eligibility before payment.');
    message.value=lines.join(String.fromCharCode(10));
    for(const field of ['design_reference','design_photo_url','requested_magazine','quoted_price'])form.querySelector('input[name="'+field+'"]')?.remove();
    let hidden=form.querySelector('input[name="order_summary"]');
    if(!hidden){hidden=document.createElement('input');hidden.type='hidden';hidden.name='order_summary';form.append(hidden);}
    hidden.value=message.value;
    document.getElementById('contact').scrollIntoView({behavior:'smooth'});message.focus({preventScroll:true});
  });
  drawCart();

  // The engraving appearance disclaimer remains visibly displayed on the page.
  // Customers can request a design without an additional acknowledgment step.
  function confirmInquiry(product, type) {
    if (!product.supportedMagazines.includes(type)) return;
    inquiry(product, type);
  }
  const money = n => '$' + n.toFixed(2);
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
    const order = document.createElement('button'); order.type = 'button'; order.className = 'shop-inquire'; order.textContent = 'REQUEST THIS DESIGN ↗'; order.disabled = true;
    select.addEventListener('change', () => { order.disabled = !select.value; });
    order.addEventListener('click', () => confirmInquiry(product,select.value));
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
    for (const field of ['design_reference','design_photo_url','requested_magazine','quoted_price']) contact.querySelector('input[name= + field + ]')?.remove();
    message.value = 'CUSTOM ENGRAVING DESIGN REQUEST\n' +
      'Preferred magazine: ' + magazine + '\n' +
      'Design concept: ' + idea + '\n\n' +
      'I acknowledge the $10 design deposit is due before design work begins and is credited toward my magazine purchase. The deposit is nonrefundable after work begins if I change my mind, reject an achievable design, or stop responding. If Cornerstone Tactical cannot reasonably fulfill my original design requirements, the deposit is refunded in full. No engraving begins before design approval and final payment.';
    document.getElementById('contact').scrollIntoView({behavior:'smooth',block:'start'});
    message.focus({preventScroll:true});
  });
})();
