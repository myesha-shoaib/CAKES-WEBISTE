import './style.css'

type Category = 'Signature' | 'Celebration' | 'Mini cakes' | 'Seasonal'

type Product = {
  id: number
  name: string
  category: Category
  price: number
  image: string
  description: string
  badge?: string
}

type CartItem = {
  id: number
  quantity: number
  unitPrice: number
  size: string
}

function getAppRoot() {
  const root = document.querySelector<HTMLDivElement>('#app')
  if (!root) throw new Error('The app root element could not be found.')
  return root
}

const app = getAppRoot()

const categories: Category[] = ['Signature', 'Celebration', 'Mini cakes', 'Seasonal']
const cakeNames = [
  'Brown Butter & Fig', 'Cloud Nine Vanilla', 'Midnight Chocolate', 'Strawberry Fields',
  'Pistachio Rose', 'Lemon Meringue', 'Salted Caramel', 'Black Forest',
  'Honey Lavender', 'Raspberry Ripple', 'Tiramisu Dream', 'Coconut Snow',
  'Blood Orange Blossom', 'Pear & Almond', 'Red Velvet', 'Blueberry Crumble',
  'Chocolate Hazelnut', 'Peach Melba', 'Matcha Cloud', 'Vanilla Bean',
]
const finishingTouches = [
  'Layer Cake', 'Celebration Cake', 'Petite Cake', 'Seasonal Cake', 'Signature Cake',
  'Buttercream Cake', 'Little Cake', 'Sunday Cake', 'Specialty Cake', 'Gathering Cake',
]
const productNotes = [
  'Soft, tender layers made from scratch and finished with our signature silky buttercream.',
  'A little celebration in every slice, baked fresh in small batches with seasonal ingredients.',
  'Thoughtfully layered, delicately finished, and made to be shared with your favourite people.',
  'Our pastry team balances bright, beautiful flavours with a cloud-soft crumb.',
]
const featuredIds = [0, 7, 2, 14, 4, 9, 12, 16]
const photo = (number: number) => `/images/cake-${String(number).padStart(3, '0')}.jpg`

const products: Product[] = Array.from({ length: 200 }, (_, index) => {
  const name = cakeNames[index % cakeNames.length]
  const category = categories[index % categories.length]
  return {
    id: index + 1,
    name: `${name} ${finishingTouches[Math.floor(index / cakeNames.length)]}`,
    category,
    price: 34 + ((index * 7) % 32),
    image: photo(index + 1),
    description: productNotes[index % productNotes.length],
    ...(index === 0 || index === 7 || index === 14 ? { badge: 'Bestseller' } : {}),
  }
})

const heroSlides = [
  {
    image: photo(1),
    eyebrow: 'MADE FOR THE MOMENTS THAT MATTER',
    title: 'A little slice of <em>the extraordinary.</em>',
    copy: 'Small-batch cakes, made slowly and shared generously. Find the one that feels like you.',
  },
  {
    image: photo(2),
    eyebrow: 'A VERY GOOD REASON TO GATHER',
    title: 'Bring everyone <em>to the table.</em>',
    copy: 'From candle-blowing birthdays to just-because Tuesdays, there is always room for cake.',
  },
  {
    image: photo(3),
    eyebrow: 'BAKED FRESH, EVERY SINGLE MORNING',
    title: 'The sweetest kind of <em>slow living.</em>',
    copy: 'Honest ingredients, joyful flavours, and a little extra butter. That is our whole recipe.',
  },
]

const cartKey = 'sucre-saffron-cart'
const themeKey = 'sucre-saffron-theme'
let heroSlideIndex = 0
let heroTimer: number | undefined
let heroTransitionTimer: number | undefined
let heroPaused = false
let heroInteractionActive = false
let selectedProductSize = 1

function savedTheme(): 'light' | 'dark' {
  return localStorage.getItem(themeKey) === 'dark' ? 'dark' : 'light'
}

const initialTheme = savedTheme()
document.documentElement.dataset.theme = initialTheme
document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute(
  'content',
  initialTheme === 'dark' ? '#211b19' : '#fbf8f1',
)

function readCart(): CartItem[] {
  const rawCart = localStorage.getItem(cartKey)
  if (!rawCart) return []

  const value: unknown = JSON.parse(rawCart)
  if (!Array.isArray(value)) {
    throw new Error('Your saved basket could not be read. Please clear the site storage and try again.')
  }
  return value.filter((item): item is CartItem =>
    typeof item === 'object'
    && item !== null
    && typeof item.id === 'number'
    && typeof item.quantity === 'number'
    && typeof item.unitPrice === 'number'
    && typeof item.size === 'string',
  )
}

function saveCart(cart: CartItem[]) {
  localStorage.setItem(cartKey, JSON.stringify(cart))
}

function cartQuantity() {
  return readCart().reduce((total, item) => total + item.quantity, 0)
}

function cartTotal() {
  return readCart().reduce((total, item) => total + item.quantity * item.unitPrice, 0)
}

function money(amount: number) {
  return `$${amount.toFixed(2)}`
}

function icon(name: 'bag' | 'arrow' | 'sparkle' | 'instagram' | 'menu' | 'close' | 'sun' | 'moon') {
  const paths: Record<typeof name, string> = {
    bag: '<path d="M5 8h14l1 13H4L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
    sparkle: '<path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
    moon: '<path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"/>',
  }
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`
}

function header() {
  const isDark = document.documentElement.dataset.theme === 'dark'
  return `
    <div class="announcement">A little sweetness, delivered. <a href="#/shop">Order something lovely <span>↗</span></a></div>
    <header class="site-header">
      <a class="wordmark" href="#/" aria-label="Sucre and Saffron home"><span class="wordmark-icon">${icon('sparkle')}</span><span>sucre<span class="wordmark-amp">&</span>saffron<small>THE LITTLE CAKE STUDIO</small></span></a>
      <button class="mobile-menu-toggle icon-button" data-action="menu" aria-label="Toggle navigation">${icon('menu')}</button>
      <nav class="main-nav" aria-label="Main navigation">
        <a href="#/shop">Shop cakes</a>
        <a href="#/collections">Collections</a>
        <a href="#/story">Our story</a>
        <a href="#/contact">Say hello</a>
        <a class="mobile-cart-link" href="#/cart">Your basket (${cartQuantity()})</a>
      </nav>
      <button class="theme-toggle icon-button" data-action="theme" type="button" aria-label="Switch to ${isDark ? 'light' : 'dark'} mode" title="Switch to ${isDark ? 'light' : 'dark'} mode">${icon(isDark ? 'sun' : 'moon')}<span>${isDark ? 'Light' : 'Dark'}</span></button>
      <a class="header-bag" href="#/cart" aria-label="Shopping basket, ${cartQuantity()} items">${icon('bag')}<span>Basket</span><b>${cartQuantity()}</b></a>
    </header>`
}

function footer() {
  return `
    <footer class="site-footer">
      <div class="footer-top">
        <div class="footer-brand">
          <a class="wordmark footer-wordmark" href="#/"><span class="wordmark-icon">${icon('sparkle')}</span><span>sucre<span class="wordmark-amp">&</span>saffron<small>THE LITTLE CAKE STUDIO</small></span></a>
          <p>Made with good butter, good people, and a little bit of magic.</p>
        </div>
        <div><h3>Come on in</h3><a href="#/shop">Shop all cakes</a><a href="#/collections">Our collections</a><a href="#/story">Our story</a></div>
        <div><h3>Need a hand?</h3><a href="#/contact">Get in touch</a><a href="#/contact">Delivery & pickup</a><a href="#/contact">Frequently asked</a></div>
        <div class="footer-note"><span class="footer-sparkle">${icon('sparkle')}</span><p>A cake for the middle of the week, too.</p><a class="text-link" href="#/shop">Find your cake ${icon('arrow')}</a></div>
      </div>
      <div class="footer-bottom"><span>© 2026 Sucre & Saffron. Baked with love.</span><span>Thoughtful ingredients. Joyful occasions.</span><a href="https://unsplash.com" target="_blank" rel="noreferrer">Photography via Unsplash</a></div>
    </footer>`
}

function productCard(product: Product, extraClass = '') {
  return `
    <article class="product-card ${extraClass}" data-category="${product.category}" data-name="${product.name.toLowerCase()}" style="--card-delay: ${Math.min(product.id % 12, 8) * 35}ms">
      <a class="product-image-wrap" href="#/product/${product.id}" aria-label="View ${product.name}">
        <img src="${product.image}" alt="${product.name}" loading="lazy">
        ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
        <span class="product-quick-view">A closer look <span>↗</span></span>
      </a>
      <div class="product-meta"><span>${product.category}</span><span>${money(product.price)}</span></div>
      <a class="product-name" href="#/product/${product.id}">${product.name}</a>
    </article>`
}

function homePage() {
  return `
    <section class="hero-slider" aria-label="Featured cakes">
      <div class="hero-photo-wrap"><img class="hero-photo" id="hero-photo" src="${heroSlides[0].image}" alt="A freshly decorated cake" fetchpriority="high"><div class="hero-photo-shadow"></div><span class="hero-photo-caption">a little joy, layered</span><span class="hero-orbit hero-orbit-one"></span><span class="hero-orbit hero-orbit-two"></span></div>
      <div class="hero-copy" aria-live="polite">
        <div class="eyebrow"><span class="eyebrow-dot"></span><span id="hero-eyebrow">${heroSlides[0].eyebrow}</span></div>
        <h1 id="hero-title">${heroSlides[0].title}</h1>
        <p id="hero-copy">${heroSlides[0].copy}</p>
        <div class="hero-actions"><a class="button button-dark" href="#/shop">Find your cake ${icon('arrow')}</a><a class="button button-text" href="#/story">A little about us <span>↗</span></a></div>
        <div class="hero-controls"><div class="hero-dots">${heroSlides.map((_, index) => `<button class="hero-dot ${index === 0 ? 'is-active' : ''}" data-action="hero-slide" data-slide="${index}" aria-label="Go to slide ${index + 1}" aria-current="${index === 0 ? 'true' : 'false'}"></button>`).join('')}</div><div class="hero-arrows"><button class="round-arrow" data-action="hero-prev" aria-label="Previous slide">←</button><button class="round-arrow" data-action="hero-next" aria-label="Next slide">→</button></div><button class="hero-pause" data-action="hero-toggle" aria-label="Pause slideshow" title="Pause slideshow">Ⅱ</button><span class="hero-count"><b id="hero-current">01</b> / 03</span></div>
      </div>
      <div class="hero-stamp"><span>BAKED<br>WITH LOVE</span>${icon('sparkle')}</div>
    </section>
    <div class="promise-strip"><span>♡ &nbsp; Real butter, always</span><i></i><span>✳ &nbsp; Baked fresh each morning</span><i></i><span>♡ &nbsp; Made for sharing (or not)</span></div>
    <section class="section-block categories-section">
      <div class="section-heading"><div><span class="eyebrow">A CAKE FOR EVERY KIND OF DAY</span><h2>Find your <em>happy place.</em></h2></div><a class="text-link" href="#/collections">Explore all collections ${icon('arrow')}</a></div>
      <div class="category-grid">
        <a class="category-tile category-large" href="#/shop?category=Signature"><img src="${photo(5)}" alt="Signature pistachio and rose cake" loading="lazy"><span class="category-tile-copy"><small>THE LITTLE SHOWSTOPPERS</small><strong>Signature<br>layer cakes</strong><span>Eight layers of lovely ↗</span></span></a>
        <a class="category-tile" href="#/shop?category=Celebration"><img src="${photo(8)}" alt="A beautiful celebration cake" loading="lazy"><span class="category-tile-copy"><small>MAKE A WISH</small><strong>For the big<br>little days</strong><span>Make it a moment ↗</span></span></a>
        <a class="category-tile category-tile-light" href="#/shop?category=Mini%20cakes"><img src="${photo(11)}" alt="A delicate little cake" loading="lazy"><span class="category-tile-copy"><small>SMALL CAKE, BIG FEELING</small><strong>A little<br>something</strong><span>Meet the petite cakes ↗</span></span></a>
      </div>
    </section>
    <section class="section-block bestsellers-section">
      <div class="section-heading"><div><span class="eyebrow">THE ONES YOU LOVE MOST</span><h2>Good things, <em>on repeat.</em></h2></div><div class="slider-controls"><button class="round-arrow" data-action="scroll-products" data-direction="-1" aria-label="Scroll products left">←</button><button class="round-arrow" data-action="scroll-products" data-direction="1" aria-label="Scroll products right">→</button></div></div>
      <div class="product-rail" id="featured-rail">${featuredIds.map((id) => productCard(products[id])).join('')}</div>
      <div class="centered-link"><a class="button button-outline" href="#/shop">See all 200 little lovelies ${icon('arrow')}</a></div>
    </section>
    <section class="story-band">
      <div class="story-band-photo"><img src="${photo(18)}" alt="A cake made with care in our little studio" loading="lazy"><span class="story-photo-note">made slowly, shared happily</span></div>
      <div class="story-band-copy"><span class="eyebrow">A SMALL STUDIO WITH A BIG SWEET TOOTH</span><h2>We believe a cake can make an ordinary day <em>feel like a story.</em></h2><p>We are a little neighbourhood cake studio with a soft spot for real ingredients, imperfect piping, and that first slice everyone leans in for.</p><a class="button button-dark" href="#/story">Come meet us ${icon('arrow')}</a><span class="handwritten-note">So glad you're here! <span>♡</span></span></div>
    </section>
    <section class="newsletter-section"><div class="newsletter-flower">${icon('sparkle')}</div><span class="eyebrow">A VERY SWEET LETTER</span><h2>Good things are <em>in the oven.</em></h2><p>New flavours, little love notes, and the occasional excuse to eat cake.</p><form class="newsletter-form" data-form="newsletter"><label class="sr-only" for="newsletter-email">Your email address</label><input type="email" id="newsletter-email" name="email" placeholder="Your email address" required><button type="submit" class="button button-dark">Count me in ${icon('arrow')}</button></form><small>Just the good stuff. Never any crumbs in your inbox.</small></section>`
}

function shopPage() {
  const query = new URLSearchParams(window.location.hash.split('?')[1] ?? '')
  const selectedCategory = query.get('category') ?? 'All cakes'
  const filters = ['All cakes', ...categories]
  return `
    <section class="page-intro shop-intro"><div class="eyebrow"><span class="eyebrow-dot"></span>THE CAKE COUNTER IS OPEN</div><h1>A little something <em>for everyone.</em></h1><p>Small-batch, big-hearted cakes. Find your new favourite below.</p><span class="intro-doodle">${icon('sparkle')}</span></section>
    <section class="shop-section section-block">
      <div class="shop-toolbar"><div class="filter-row">${filters.map((filter) => `<button class="filter-chip ${selectedCategory === filter ? 'is-active' : ''}" data-action="filter" data-filter="${filter}">${filter}</button>`).join('')}</div><label class="search-box">${icon('sparkle')}<input id="product-search" type="search" placeholder="Find a flavour..." aria-label="Search cakes"><span id="result-count">200 cakes</span></label></div>
      <div class="shop-grid" id="shop-grid">${products.map((product) => productCard(product)).join('')}</div>
      <p class="catalogue-note">Every little cake is baked fresh to order in our studio. Good things are worth waiting for.</p>
    </section>`
}

function collectionsPage() {
  const collectionDetails = [
    { name: 'Signature layer cakes', category: 'Signature', note: 'Our beloved, show-stopping layers, made for a proper sit-down-and-slice moment.', image: 5, count: '01 — 50' },
    { name: 'Big little celebrations', category: 'Celebration', note: 'Candles optional. Feeling special absolutely non-negotiable.', image: 8, count: '51 — 100' },
    { name: 'Petite, but perfectly lovely', category: 'Mini cakes', note: 'A little cake for one, two, or a very good Tuesday afternoon.', image: 11, count: '101 — 150' },
    { name: 'The changing seasons', category: 'Seasonal', note: 'Market-fresh fruit, lovely spices, and whatever the season is dreaming up.', image: 15, count: '151 — 200' },
  ]
  return `
    <section class="page-intro"><div class="eyebrow"><span class="eyebrow-dot"></span>THE SWEET LITTLE DETAILS</div><h1>Meet our <em>collections.</em></h1><p>Two hundred ways to make an ordinary day feel a little more like yours.</p></section>
    <section class="collection-list section-block">${collectionDetails.map((collection, index) => `
      <article class="collection-row ${index % 2 ? 'collection-reverse' : ''}"><a href="#/shop?category=${encodeURIComponent(collection.category)}" class="collection-image"><img src="${photo(collection.image)}" alt="${collection.name}" loading="lazy"><span>${collection.count} cakes to explore</span></a><div class="collection-copy"><span class="eyebrow">COLLECTION 0${index + 1}</span><h2>${collection.name.split(' ').slice(0, -1).join(' ')} <em>${collection.name.split(' ').slice(-1)}</em></h2><p>${collection.note}</p><a class="text-link" href="#/shop?category=${encodeURIComponent(collection.category)}">Explore the collection ${icon('arrow')}</a></div></article>`).join('')}</section>`
}

function storyPage() {
  return `
    <section class="story-hero page-intro"><div class="eyebrow"><span class="eyebrow-dot"></span>A LITTLE BIT ABOUT US</div><h1>We bake like <em>we mean it.</em></h1><p>Because the best things in life are meant to be made slowly, shared generously, and eaten with a fork straight from the cake stand.</p><div class="story-hero-image"><img src="${photo(23)}" alt="The Sucre and Saffron team decorating a cake" loading="lazy"><span>OUR LITTLE CORNER OF THE WORLD</span></div></section>
    <section class="story-values section-block"><div class="value-copy"><span class="eyebrow">THE SHORT VERSION</span><h2>We started with a borrowed mixer and <em>an unreasonable amount of butter.</em></h2><p>Sucre & Saffron began as a tiny kitchen experiment: a few cakes for the people we loved and a belief that the best recipes taste like somebody cared enough to take their time.</p><p>Today, not much has changed. We are still a small team, still making everything by hand, and still sneaking the first slice when nobody is looking.</p><a class="button button-dark" href="#/shop">Taste what we mean ${icon('arrow')}</a></div><div class="values-stack"><article><span>01</span><div><h3>Good things, real ingredients.</h3><p>Real butter, beautiful fruit, and absolutely no shortcuts on the good stuff.</p></div></article><article><span>02</span><div><h3>Small batches, every morning.</h3><p>We bake what we need, when it is needed. Fresh is a feeling, too.</p></div></article><article><span>03</span><div><h3>Made to be shared.</h3><p>Pass the plate, tell the story, and save that last little piece for someone.</p></div></article></div></section>
    <section class="story-quote"><span>“</span><blockquote>Every cake is a small way of saying, <em>I'm glad you're here.</em></blockquote><small>— THE SUCRE & SAFFRON WAY</small></section>
    <section class="section-block"><div class="section-heading"><div><span class="eyebrow">A VERY GOOD PLACE TO START</span><h2>There is cake <em>with your name on it.</em></h2></div><a class="text-link" href="#/shop">Find your favourite ${icon('arrow')}</a></div></section>`
}

function contactPage() {
  return `
    <section class="page-intro"><div class="eyebrow"><span class="eyebrow-dot"></span>WE WOULD LOVE A NOTE</div><h1>Say hello, <em>sweet friend.</em></h1><p>Questions, custom cake dreams, or just want to tell us your favourite flavour? We are all ears.</p></section>
    <section class="contact-layout section-block"><div class="contact-card"><span class="eyebrow">THE LITTLE CAKE STUDIO</span><h2>Come by for a <em>little hello.</em></h2><p>Our studio is open for cake pickup and a good chat. For custom cakes, give us a few days' notice so we can make your idea extra lovely.</p><div class="contact-detail"><span>✳</span><div><b>Find our studio</b><p>14 Butter Lane, Little Village</p></div></div><div class="contact-detail"><span>♡</span><div><b>Studio hours</b><p>Tuesday — Saturday, 9am — 5pm</p></div></div><div class="contact-detail"><span>✉</span><div><b>Write us a little note</b><p>hello@sucreandsaffron.com</p></div></div><div class="contact-social">${icon('instagram')} <span>Come say hi on Instagram <b>@sucreandsaffron</b></span></div></div>
      <form class="contact-form" data-form="contact"><span class="eyebrow">SEND A LITTLE NOTE</span><h2>What's on <em>your mind?</em></h2><label>Your name<input name="name" autocomplete="name" placeholder="The name your friends call you" required></label><label>Your email<input type="email" name="email" autocomplete="email" placeholder="you@somewhere.com" required></label><label>What can we help with?<select name="topic"><option>I'm dreaming up a custom cake</option><option>I have a question about an order</option><option>Just saying hello</option><option>Something else entirely</option></select></label><label>Your note<textarea name="message" rows="4" placeholder="Tell us all about it..." required></textarea></label><button class="button button-dark" type="submit">Send your note ${icon('arrow')}</button></form></section>`
}

function productPage(product: Product) {
  selectedProductSize = 1
  return `
    <div class="breadcrumbs"><a href="#/">Home</a><span>/</span><a href="#/shop">Shop cakes</a><span>/</span><span>${product.name}</span></div>
    <section class="product-detail section-block"><div class="detail-image"><img src="${product.image}" alt="${product.name}"><span class="detail-image-label">${product.category.toUpperCase()} · MADE FRESH TO ORDER</span></div><div class="detail-copy"><span class="eyebrow"><span class="eyebrow-dot"></span>${product.category.toUpperCase()} · SMALL BATCH</span><h1>${product.name.split(' ').slice(0, -1).join(' ')} <em>${product.name.split(' ').slice(-1)}</em></h1><div class="detail-rating"><span>★★★★★</span> A studio favourite</div><p class="detail-description">${product.description} Finished by hand, wrapped with care, and ready to make somebody's day.</p><div class="detail-price" id="product-price">${money(product.price)}</div><fieldset class="size-picker"><legend>Pick your little cake size</legend><div><button class="size-option is-selected" data-action="size" data-size="1" type="button"><b>Petite</b><small>6" · serves 6</small></button><button class="size-option" data-action="size" data-size="1.35" type="button"><b>Gather round</b><small>8" · serves 10</small></button><button class="size-option" data-action="size" data-size="1.7" type="button"><b>The whole table</b><small>10" · serves 16</small></button></div></fieldset><button class="button button-dark detail-add" data-action="add-cart" data-id="${product.id}">Add to your basket · <span id="add-price">${money(product.price)}</span> ${icon('arrow')}</button><div class="detail-promises"><span>♡ Baked fresh to order</span><span>✳ Local pickup & delivery</span><span>♡ A little note in every box</span></div><div class="detail-note"><b>A little heads up</b><p>Our cakes are made in a kitchen that handles nuts, gluten, dairy, and eggs. Need something special? <a href="#/contact">Tell us about it.</a></p></div></div></section>
    <section class="section-block detail-more"><div class="section-heading"><div><span class="eyebrow">CAKE LOVES COMPANY</span><h2>A few more <em>to fall for.</em></h2></div><a class="text-link" href="#/shop">See all cakes ${icon('arrow')}</a></div><div class="product-rail">${products.slice(product.id % 12, product.id % 12 + 4).map((item) => productCard(item)).join('')}</div></section>`
}

function cartPage() {
  const cart = readCart()
  const entries = cart.map((item) => ({ item, product: products.find((product) => product.id === item.id) })).filter((entry): entry is { item: CartItem; product: Product } => Boolean(entry.product))
  if (!entries.length) {
    return `<section class="empty-state"><span class="empty-sparkle">${icon('sparkle')}</span><div class="eyebrow">A LITTLE ROOM FOR SOMETHING LOVELY</div><h1>Your basket is <em>waiting for cake.</em></h1><p>It is always a good time to find a little something for the table.</p><a class="button button-dark" href="#/shop">Find your cake ${icon('arrow')}</a></section>`
  }
  return `
    <section class="page-intro cart-intro"><div class="eyebrow"><span class="eyebrow-dot"></span>YOUR LITTLE LINEUP</div><h1>Good choices, <em>right here.</em></h1><p>Everything is baked fresh, just for you.</p></section>
    <section class="cart-layout section-block"><div class="cart-items">${entries.map(({ item, product }) => `<article class="cart-item"><a href="#/product/${product.id}" class="cart-thumb"><img src="${product.image}" alt="${product.name}" loading="lazy"></a><div class="cart-item-copy"><span class="eyebrow">${product.category}</span><a href="#/product/${product.id}"><h2>${product.name}</h2></a><span>${money(item.unitPrice)} · ${item.size}</span><button class="remove-link" data-action="remove-cart" data-id="${product.id}" data-cart-size="${item.size}">Remove from basket</button></div><div class="quantity-control"><button data-action="quantity" data-id="${product.id}" data-cart-size="${item.size}" data-change="-1" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button data-action="quantity" data-id="${product.id}" data-cart-size="${item.size}" data-change="1" aria-label="Increase quantity">+</button></div><strong class="cart-line-price">${money(item.quantity * item.unitPrice)}</strong></article>`).join('')}</div><aside class="cart-summary"><span class="eyebrow">THE SWEET LITTLE DETAILS</span><h2>Your cake <em>math.</em></h2><div class="summary-row"><span>Subtotal</span><b>${money(cartTotal())}</b></div><div class="summary-row"><span>Delivery</span><span>Calculated at checkout</span></div><p>Delivery and pickup options are available at checkout.</p><a class="button button-dark" href="#/checkout">On to checkout ${icon('arrow')}</a><a class="continue-shopping" href="#/shop">← Keep browsing the cake counter</a></aside></section>`
}

function checkoutPage() {
  if (!readCart().length) {
    return `<section class="empty-state"><div class="eyebrow">ONE LITTLE THING FIRST</div><h1>Let's find a cake <em>before checkout.</em></h1><a class="button button-dark" href="#/shop">Visit the cake counter ${icon('arrow')}</a></section>`
  }
  return `
    <section class="page-intro checkout-intro"><div class="eyebrow"><span class="eyebrow-dot"></span>THE LAST LITTLE STEP</div><h1>Let's make it <em>official.</em></h1><p>We will get your fresh-baked lovelies ready just for you.</p></section>
    <section class="checkout-layout section-block"><form class="checkout-form" data-form="checkout"><span class="eyebrow">TELL US WHERE TO FIND YOU</span><label>Your name<input name="name" autocomplete="name" required></label><label>Email address<input type="email" name="email" autocomplete="email" required></label><label>Delivery address<input name="address" autocomplete="street-address" placeholder="14 Butter Lane, Little Village" required></label><div class="checkout-row"><label>Preferred date<input type="date" name="date" required></label><label>Pickup or delivery<select name="delivery"><option>Local delivery</option><option>Studio pickup</option></select></label></div><label class="checkout-check"><input type="checkbox" required><span>I understand each cake is made fresh to order, just for me.</span></label><button class="button button-dark" type="submit">Place my cake order · ${money(cartTotal())} ${icon('arrow')}</button><p class="checkout-small">This is a demo checkout. No payment details are collected.</p></form><aside class="checkout-summary"><span class="eyebrow">YOUR LITTLE LINEUP</span><h2>A very good <em>decision.</em></h2>${readCart().map((item) => { const product = products.find((entry) => entry.id === item.id); return product ? `<div class="checkout-item"><img src="${product.image}" alt="" loading="lazy"><span>${product.name}<small>${item.size} · Qty ${item.quantity}</small></span><b>${money(item.unitPrice * item.quantity)}</b></div>` : '' }).join('')}<div class="summary-row checkout-total"><span>Total</span><b>${money(cartTotal())}</b></div></aside></section>`
}

function confirmationPage() {
  return `<section class="empty-state confirmation-state"><span class="empty-sparkle">${icon('sparkle')}</span><div class="eyebrow">A VERY SWEET THING IS ON ITS WAY</div><h1>Consider this a <em>cake-shaped hug.</em></h1><p>Your demo order has been received. Your cake day is already looking lovely.</p><a class="button button-dark" href="#/shop">Find another little lovely ${icon('arrow')}</a></section>`
}

function renderPage() {
  if (heroTimer) window.clearInterval(heroTimer)
  if (heroTransitionTimer) window.clearTimeout(heroTransitionTimer)
  const route = window.location.hash.replace(/^#/, '') || '/'
  const path = route.split('?')[0]
  let content = ''

  if (path === '/') content = homePage()
  else if (path === '/shop') content = shopPage()
  else if (path === '/collections') content = collectionsPage()
  else if (path === '/story') content = storyPage()
  else if (path === '/contact') content = contactPage()
  else if (path === '/cart') content = cartPage()
  else if (path === '/checkout') content = checkoutPage()
  else if (path === '/order-confirmation') content = confirmationPage()
  else if (path.startsWith('/product/')) {
    const id = Number(path.split('/')[2])
    const product = products.find((item) => item.id === id)
    content = product ? productPage(product) : `<section class="empty-state"><div class="eyebrow">THAT CAKE HAS GONE MISSING</div><h1>Let's find you <em>another lovely.</em></h1><a class="button button-dark" href="#/shop">Back to all cakes ${icon('arrow')}</a></section>`
  } else {
    content = `<section class="empty-state"><div class="eyebrow">A LITTLE WRONG TURN</div><h1>There is cake <em>this way.</em></h1><a class="button button-dark" href="#/">Back to the beginning ${icon('arrow')}</a></section>`
  }

  app.innerHTML = `${header()}<main id="page-view" class="page-view">${content}</main>${footer()}<div class="toast" id="toast" role="status" aria-live="polite"></div>`
  document.title = `${pageTitle(path)} | Sucre & Saffron`

  if (path === '/') {
    heroSlideIndex = 0
    heroPaused = false
    heroInteractionActive = false
    setupHeroSlider()
    updateHeroToggle()
    resetHeroTimer()
  }
  if (path === '/shop') {
    const selectedCategory = new URLSearchParams(route.split('?')[1] ?? '').get('category')
    if (selectedCategory) applyShopFilter(selectedCategory)
  }
}

function pageTitle(path: string) {
  if (path.startsWith('/product/')) return products.find((product) => product.id === Number(path.split('/')[2]))?.name ?? 'Cakes'
  const titles: Record<string, string> = {
    '/': 'Small-batch cakes, big-hearted moments',
    '/shop': 'Shop all cakes',
    '/collections': 'Our cake collections',
    '/story': 'A little about us',
    '/contact': 'Say hello',
    '/cart': 'Your basket',
    '/checkout': 'Checkout',
    '/order-confirmation': 'A sweet little confirmation',
  }
  return titles[path] ?? 'A little cake studio'
}

function resetHeroTimer() {
  if (heroTimer) window.clearInterval(heroTimer)
  heroTimer = undefined
  if (
    heroPaused
    || heroInteractionActive
    || document.hidden
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches
    || !document.querySelector('.hero-slider')
  ) return
  heroTimer = window.setInterval(() => showHeroSlide(heroSlideIndex + 1), 6000)
}

function updateHeroToggle() {
  const toggle = document.querySelector<HTMLButtonElement>('.hero-pause')
  if (!toggle) return
  toggle.textContent = heroPaused ? '▶' : 'Ⅱ'
  toggle.setAttribute('aria-label', `${heroPaused ? 'Play' : 'Pause'} slideshow`)
  toggle.title = `${heroPaused ? 'Play' : 'Pause'} slideshow`
}

function setupHeroSlider() {
  const slider = document.querySelector<HTMLElement>('.hero-slider')
  if (!slider) return

  slider.addEventListener('pointerenter', () => {
    heroInteractionActive = true
    if (heroTimer) window.clearInterval(heroTimer)
    heroTimer = undefined
  })
  slider.addEventListener('pointerleave', () => {
    heroInteractionActive = false
    resetHeroTimer()
  })
  slider.addEventListener('focusin', () => {
    heroInteractionActive = true
    if (heroTimer) window.clearInterval(heroTimer)
    heroTimer = undefined
  })
  slider.addEventListener('focusout', (event) => {
    if (!(event.relatedTarget instanceof Node) || !slider.contains(event.relatedTarget)) {
      heroInteractionActive = false
      resetHeroTimer()
    }
  })

  let pointerStart: number | undefined
  slider.addEventListener('pointerdown', (event) => {
    if (event.target instanceof Element && event.target.closest('.hero-photo-wrap')) pointerStart = event.clientX
  })
  slider.addEventListener('pointerup', (event) => {
    if (pointerStart === undefined) return
    const distance = event.clientX - pointerStart
    pointerStart = undefined
    if (Math.abs(distance) > 45) showHeroSlide(heroSlideIndex + (distance < 0 ? 1 : -1))
  })
  slider.addEventListener('pointercancel', () => {
    pointerStart = undefined
  })
}

function showHeroSlide(index: number) {
  heroSlideIndex = (index + heroSlides.length) % heroSlides.length
  const slide = heroSlides[heroSlideIndex]
  const photoElement = document.querySelector<HTMLImageElement>('#hero-photo')
  const eyebrow = document.querySelector<HTMLElement>('#hero-eyebrow')
  const title = document.querySelector<HTMLElement>('#hero-title')
  const copy = document.querySelector<HTMLElement>('#hero-copy')
  if (!photoElement || !eyebrow || !title || !copy) return

  const heroCopy = document.querySelector<HTMLElement>('.hero-copy')
  if (heroTransitionTimer) window.clearTimeout(heroTransitionTimer)
  heroCopy?.classList.add('is-changing')
  photoElement.classList.add('is-changing')
  heroTransitionTimer = window.setTimeout(() => {
    photoElement.src = slide.image
    photoElement.alt = `Cake ${heroSlideIndex + 1}: ${slide.eyebrow.toLowerCase()}`
    eyebrow.textContent = slide.eyebrow
    title.innerHTML = slide.title
    copy.textContent = slide.copy
    document.querySelectorAll<HTMLButtonElement>('.hero-dot').forEach((dot, dotIndex) => {
      dot.classList.toggle('is-active', dotIndex === heroSlideIndex)
      dot.setAttribute('aria-current', dotIndex === heroSlideIndex ? 'true' : 'false')
    })
    const current = document.querySelector<HTMLElement>('#hero-current')
    if (current) current.textContent = String(heroSlideIndex + 1).padStart(2, '0')
    heroCopy?.classList.remove('is-changing')
    photoElement.classList.remove('is-changing')
    resetHeroTimer()
  }, 180)
}

let activeTiltTarget: HTMLElement | null = null

function clearTiltTarget() {
  activeTiltTarget?.style.removeProperty('--tilt-x')
  activeTiltTarget?.style.removeProperty('--tilt-y')
  activeTiltTarget = null
}

function setTheme(theme: 'light' | 'dark') {
  document.documentElement.dataset.theme = theme
  localStorage.setItem(themeKey, theme)
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute(
    'content',
    theme === 'dark' ? '#211b19' : '#fbf8f1',
  )
  const toggle = document.querySelector<HTMLButtonElement>('.theme-toggle')
  if (!toggle) return
  toggle.innerHTML = `${icon(theme === 'dark' ? 'sun' : 'moon')}<span>${theme === 'dark' ? 'Light' : 'Dark'}</span>`
  toggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`)
  toggle.title = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`
}

function applyShopFilter(filter: string, search = '') {
  const normalizedSearch = search.trim().toLowerCase()
  let count = 0
  document.querySelectorAll<HTMLElement>('#shop-grid .product-card').forEach((card) => {
    const categoryMatches = filter === 'All cakes' || card.dataset.category === filter
    const searchMatches = !normalizedSearch || card.dataset.name?.includes(normalizedSearch)
    card.hidden = !categoryMatches || !searchMatches
    if (!card.hidden) count++
  })
  const countElement = document.querySelector<HTMLElement>('#result-count')
  if (countElement) countElement.textContent = `${count} ${count === 1 ? 'cake' : 'cakes'}`
  document.querySelectorAll<HTMLButtonElement>('.filter-chip').forEach((button) => button.classList.toggle('is-active', button.dataset.filter === filter))
}

function showToast(message: string) {
  const toast = document.querySelector<HTMLElement>('#toast')
  if (!toast) return
  toast.textContent = message
  toast.classList.add('is-visible')
  window.setTimeout(() => toast.classList.remove('is-visible'), 2800)
}

function addToCart(id: number, priceMultiplier = 1) {
  const product = products.find((item) => item.id === id)
  if (!product) return
  const unitPrice = Math.round(product.price * priceMultiplier * 100) / 100
  const size = priceMultiplier >= 1.65 ? 'The whole table' : priceMultiplier >= 1.3 ? 'Gather round' : 'Petite'
  const cart = readCart()
  const existing = cart.find((item) => item.id === id && item.size === size)
  if (existing) existing.quantity++
  else cart.push({ id, quantity: 1, unitPrice, size })
  saveCart(cart)
  renderPage()
  showToast(`${product.name} is in your basket. Lovely choice!`)
}

app.addEventListener('pointermove', (event) => {
  if (event.pointerType === 'touch' || window.innerWidth <= 720) return
  const target = event.target
  if (!(target instanceof Element)) return
  const tiltElement = target.closest<HTMLElement>('.hero-photo-wrap, .product-image-wrap, .detail-image')
  if (!tiltElement) {
    clearTiltTarget()
    return
  }
  if (activeTiltTarget !== tiltElement) {
    clearTiltTarget()
    activeTiltTarget = tiltElement
  }
  const bounds = tiltElement.getBoundingClientRect()
  const x = (event.clientX - bounds.left) / bounds.width - 0.5
  const y = (event.clientY - bounds.top) / bounds.height - 0.5
  tiltElement.style.setProperty('--tilt-x', `${(-y * 8).toFixed(2)}deg`)
  tiltElement.style.setProperty('--tilt-y', `${(x * 9).toFixed(2)}deg`)
})

app.addEventListener('pointerleave', clearTiltTarget, true)

app.addEventListener('click', (event) => {
  const target = event.target
  if (!(target instanceof Element)) return
  const button = target.closest<HTMLElement>('[data-action]')
  if (!button) return

  const action = button.dataset.action
  if (action === 'menu') {
    document.querySelector('.main-nav')?.classList.toggle('is-open')
  } else if (action === 'theme') {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark')
  } else if (action === 'hero-toggle') {
    heroPaused = !heroPaused
    updateHeroToggle()
    resetHeroTimer()
  } else if (action === 'hero-next') {
    showHeroSlide(heroSlideIndex + 1)
  } else if (action === 'hero-prev') {
    showHeroSlide(heroSlideIndex - 1)
  } else if (action === 'hero-slide') {
    showHeroSlide(Number(button.dataset.slide))
  } else if (action === 'scroll-products') {
    document.querySelector('#featured-rail')?.scrollBy({ left: Number(button.dataset.direction) * 360, behavior: 'smooth' })
  } else if (action === 'filter') {
    applyShopFilter(button.dataset.filter ?? 'All cakes', document.querySelector<HTMLInputElement>('#product-search')?.value ?? '')
  } else if (action === 'add-cart') {
    addToCart(Number(button.dataset.id), selectedProductSize)
  } else if (action === 'size') {
    selectedProductSize = Number(button.dataset.size)
    document.querySelectorAll('.size-option').forEach((option) => option.classList.toggle('is-selected', option === button))
    const productId = Number(window.location.hash.split('/')[2])
    const product = products.find((item) => item.id === productId)
    if (product) {
      const newPrice = money(product.price * selectedProductSize)
      const price = document.querySelector<HTMLElement>('#product-price')
      const addPrice = document.querySelector<HTMLElement>('#add-price')
      if (price) price.textContent = newPrice
      if (addPrice) addPrice.textContent = newPrice
    }
  } else if (action === 'remove-cart' || action === 'quantity') {
    const id = Number(button.dataset.id)
    const cart = readCart()
    const size = button.dataset.cartSize
    const item = cart.find((entry) => entry.id === id && entry.size === size)
    if (!item) return
    if (action === 'remove-cart') {
      saveCart(cart.filter((entry) => entry.id !== id || entry.size !== size))
    } else {
      item.quantity += Number(button.dataset.change)
      saveCart(cart.filter((entry) => entry.quantity > 0))
    }
    renderPage()
  }
})

app.addEventListener('input', (event) => {
  const target = event.target
  if (target instanceof HTMLInputElement && target.id === 'product-search') {
    const selected = document.querySelector<HTMLButtonElement>('.filter-chip.is-active')?.dataset.filter ?? 'All cakes'
    applyShopFilter(selected, target.value)
  }
})

app.addEventListener('submit', (event) => {
  const form = event.target
  if (!(form instanceof HTMLFormElement)) return
  const formType = form.dataset.form
  if (!formType) return
  event.preventDefault()

  if (formType === 'checkout') {
    saveCart([])
    window.location.hash = '/order-confirmation'
  } else if (formType === 'contact') {
    form.reset()
    showToast('Your note is on its way. We will be in touch soon!')
  } else if (formType === 'newsletter') {
    form.reset()
    showToast('You are on the list. Something sweet is coming!')
  }
})

window.addEventListener('hashchange', () => {
  renderPage()
  window.scrollTo({ top: 0, behavior: 'smooth' })
})

document.addEventListener('visibilitychange', resetHeroTimer)

renderPage()
