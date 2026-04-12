/**
 * ============================================================
 * AURA REALTY — Core Application Logic
 * ============================================================
 * Handles: navigation, search/filters, property rendering,
 * modals (login, register, inquiry), carousel, form validation,
 * user sessions via localStorage, and smooth scrolling.
 * ============================================================
 */

/* ─── Utility Helpers ─── */

/** Format a number as USD currency */
function formatPrice(price) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price);
}

/** Create an HTML element from a string */
function htmlToElement(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstChild;
}

/** Debounce function for search input */
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/* ─── Mobile Navigation ─── */

function initMobileNav() {
  const toggle = document.getElementById('mobile-toggle');
  const nav = document.getElementById('nav-links');
  if (!toggle || !nav) return;

  const backdrop = document.getElementById('nav-backdrop');

  const closeMenu = () => {
    nav.classList.remove('active');
    if(backdrop) backdrop.classList.remove('active');
    toggle.classList.remove('active');
    const icon = toggle.querySelector('i');
    if (icon) {
      icon.classList.remove('fa-times');
      icon.classList.add('fa-bars');
    }
  };

  const openMenu = () => {
    nav.classList.add('active');
    if(backdrop) backdrop.classList.add('active');
    toggle.classList.add('active');
    // For sidebar, we might want to keep the icon as bars or change to times
    // Realtor.com keeps bars or just hides them behind drawer, but we have a close button inside.
  };

  toggle.addEventListener('click', () => {
    if (nav.classList.contains('active')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Handle Sidebar close button (X inside drawer)
  const sidebarClose = document.getElementById('sidebar-close');
  if (sidebarClose) {
    sidebarClose.addEventListener('click', closeMenu);
  }

  // Handle Backdrop click
  if (backdrop) {
    backdrop.addEventListener('click', closeMenu);
  }

  // Close mobile nav on link click
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });
}

/* ─── Smooth Scrolling ─── */

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/* ─── Scroll-triggered Header ─── */

function initStickyHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 50);
  });
}

/* ─── Modal System ─── */

function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function initModals() {
  // Close on overlay click
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal.id);
    });
  });

  // Close buttons
  document.querySelectorAll('[data-close-modal]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-overlay');
      if (modal) closeModal(modal.id);
    });
  });

  // Open buttons
  document.querySelectorAll('[data-open-modal]').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.openModal));
  });

  // ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.active').forEach(m => closeModal(m.id));
    }
  });
}

/* ─── User Account System (localStorage) ─── */

const AUTH = {
  getUser() {
    const data = localStorage.getItem('aura_user');
    return data ? JSON.parse(data) : null;
  },

  login(email, password) {
    const users = JSON.parse(localStorage.getItem('aura_users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      localStorage.setItem('aura_user', JSON.stringify(user));
      return { success: true, user };
    }
    return { success: false, message: 'Invalid email or password.' };
  },

  register(data) {
    const users = JSON.parse(localStorage.getItem('aura_users') || '[]');
    if (users.find(u => u.email === data.email)) {
      return { success: false, message: 'An account with this email already exists.' };
    }
    const user = { ...data, id: Date.now(), role: data.role || 'client', createdAt: new Date().toISOString() };
    users.push(user);
    localStorage.setItem('aura_users', JSON.stringify(users));
    localStorage.setItem('aura_user', JSON.stringify(user));
    return { success: true, user };
  },

  logout() {
    localStorage.removeItem('aura_user');
    updateAuthUI();
  }
};

function updateAuthUI() {
  const user = AUTH.getUser();
  const loginBtns = document.querySelectorAll('.auth-login-btn');
  const registerBtns = document.querySelectorAll('.auth-register-btn');
  const userMenus = document.querySelectorAll('.auth-user-menu');
  const userNames = document.querySelectorAll('.auth-user-name');

  if (user) {
    loginBtns.forEach(b => b.style.display = 'none');
    registerBtns.forEach(b => b.style.display = 'none');
    userMenus.forEach(b => b.style.display = 'flex');
    userNames.forEach(b => b.textContent = user.name || user.email);
  } else {
    loginBtns.forEach(b => b.style.display = '');
    registerBtns.forEach(b => b.style.display = '');
    userMenus.forEach(b => b.style.display = 'none');
  }
}

function initAuth() {
  // Login form
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = loginForm.querySelector('[name="email"]').value;
      const password = loginForm.querySelector('[name="password"]').value;
      const result = AUTH.login(email, password);
      const msg = loginForm.querySelector('.form-message');
      if (result.success) {
        msg.textContent = 'Login successful!';
        msg.className = 'form-message success';
        updateAuthUI();
        setTimeout(() => closeModal('login-modal'), 800);
      } else {
        msg.textContent = result.message;
        msg.className = 'form-message error';
      }
    });
  }

  // Register form
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(registerForm);
      const data = Object.fromEntries(formData.entries());
      if (data.password !== data.confirmPassword) {
        const msg = registerForm.querySelector('.form-message');
        msg.textContent = 'Passwords do not match.';
        msg.className = 'form-message error';
        return;
      }
      const result = AUTH.register(data);
      const msg = registerForm.querySelector('.form-message');
      if (result.success) {
        msg.textContent = 'Account created successfully!';
        msg.className = 'form-message success';
        updateAuthUI();
        setTimeout(() => closeModal('register-modal'), 800);
      } else {
        msg.textContent = result.message;
        msg.className = 'form-message error';
      }
    });
  }

  // Logout buttons
  document.querySelectorAll('.auth-logout-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      AUTH.logout();
    });
  });

  // Switch between login/register modals
  document.querySelectorAll('[data-switch-modal]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const current = link.closest('.modal-overlay');
      if (current) closeModal(current.id);
      openModal(link.dataset.switchModal);
    });
  });

  updateAuthUI();
}

/* ─── Property Cards Rendering ─── */

function createPropertyCard(property) {
  const card = document.createElement('div');
  card.className = 'property-card';
  card.dataset.propertyId = property.id;

  card.innerHTML = `
    <div class="property-card__image">
      <img src="${property.images[0]}" alt="${property.title}" loading="lazy">
      <span class="property-card__badge">${property.status}</span>
      <button class="property-card__favorite" aria-label="Save property" onclick="toggleFavorite(${property.id}, this)">
        <i class="far fa-heart"></i>
      </button>
      ${property.featured ? '<span class="property-card__featured">Featured</span>' : ''}
    </div>
    <div class="property-card__content">
      <div class="property-card__price">${formatPrice(property.price)}${property.category === 'rent' ? '<span style="font-size:14px;font-weight:400;color:#6b7280;">/mo</span>' : ''}</div>
      <div class="property-card__meta">
        <span><i class="fas fa-bed"></i> ${property.beds} bd</span>
        <span><i class="fas fa-bath"></i> ${property.baths} ba</span>
        <span><i class="fas fa-ruler-combined"></i> ${property.sqft.toLocaleString()} sqft</span>
      </div>
      <h3 class="property-card__title">${property.title}</h3>
      <p class="property-card__address"><i class="fas fa-map-marker-alt"></i> ${property.address}, ${property.city}, ${property.state} ${property.zip}</p>
      <div class="property-card__footer">
        <span class="property-card__type">${property.type}</span>
        <button class="btn btn--sm btn--primary" onclick="showPropertyDetail(${property.id})">Details</button>
      </div>
    </div>
  `;
  return card;
}

function toggleFavorite(id, btn) {
  btn.classList.toggle('active');
  const icon = btn.querySelector('i');
  icon.classList.toggle('far');
  icon.classList.toggle('fas');
  // Save to localStorage
  let favs = JSON.parse(localStorage.getItem('aura_favorites') || '[]');
  if (favs.includes(id)) {
    favs = favs.filter(f => f !== id);
  } else {
    favs.push(id);
  }
  localStorage.setItem('aura_favorites', JSON.stringify(favs));
}

/* ─── Property Detail Modal ─── */

function showPropertyDetail(id) {
  const property = PROPERTIES.find(p => p.id === id);
  if (!property) return;

  const modal = document.getElementById('property-detail-modal');
  if (!modal) return;

  const body = modal.querySelector('.modal-body');
  body.innerHTML = `
    <div class="property-detail">
      <div class="property-detail__gallery">
        <img src="${property.images[0]}" alt="${property.title}" class="property-detail__main-img">
        <div class="property-detail__thumbs">
          ${property.images.map((img, i) => `<img src="${img}" alt="Photo ${i + 1}" class="property-detail__thumb ${i === 0 ? 'active' : ''}" onclick="this.closest('.property-detail__gallery').querySelector('.property-detail__main-img').src='${img}'; this.closest('.property-detail__thumbs').querySelectorAll('img').forEach(t=>t.classList.remove('active')); this.classList.add('active');">`).join('')}
        </div>
      </div>
      <div class="property-detail__info">
        <div class="property-detail__price">${formatPrice(property.price)}</div>
        <h2 class="property-detail__title">${property.title}</h2>
        <p class="property-detail__address"><i class="fas fa-map-marker-alt"></i> ${property.address}, ${property.city}, ${property.state} ${property.zip}</p>
        <div class="property-detail__features">
          <div class="feature-item"><i class="fas fa-bed"></i><span>${property.beds}</span><label>Bedrooms</label></div>
          <div class="feature-item"><i class="fas fa-bath"></i><span>${property.baths}</span><label>Bathrooms</label></div>
          <div class="feature-item"><i class="fas fa-ruler-combined"></i><span>${property.sqft.toLocaleString()}</span><label>Sq Ft</label></div>
          <div class="feature-item"><i class="fas fa-calendar"></i><span>${property.yearBuilt}</span><label>Year Built</label></div>
          <div class="feature-item"><i class="fas fa-home"></i><span>${property.type}</span><label>Type</label></div>
        </div>
        <h3>Description</h3>
        <p class="property-detail__desc">${property.description}</p>
        <div class="property-detail__agent">
          <div class="agent-avatar">${property.agent.photo ? `<img src="${property.agent.photo}" alt="${property.agent.name}">` : '<i class="fas fa-user-circle"></i>'}</div>
          <div class="agent-info">
            <strong>${property.agent.name}</strong>
            <span>${property.agent.phone}</span>
            <span>${property.agent.email}</span>
          </div>
        </div>
        <form class="property-inquiry-form" onsubmit="handleInquiry(event, ${property.id})">
          <h3>Interested in this property?</h3>
          <input type="text" name="name" placeholder="Your Name" required>
          <input type="email" name="email" placeholder="Your Email" required>
          <input type="tel" name="phone" placeholder="Your Phone">
          <textarea name="message" placeholder="I'm interested in this property..." rows="3" required></textarea>
          <button type="submit" class="btn btn--primary btn--full">Send Inquiry</button>
          <div class="form-message"></div>
        </form>
      </div>
    </div>
  `;

  openModal('property-detail-modal');
}

function handleInquiry(e, propertyId) {
  e.preventDefault();
  const form = e.target;
  const msg = form.querySelector('.form-message');
  msg.textContent = 'Thank you! Your inquiry has been sent. An agent will contact you shortly.';
  msg.className = 'form-message success';
  form.reset();
}

/* ─── Home Page: Featured Carousel ─── */

function initCarousel() {
  const track = document.getElementById('carousel-track');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  if (!track) return;

  const featured = PROPERTIES.filter(p => p.featured);
  featured.forEach(p => track.appendChild(createPropertyCard(p)));

  let position = 0;

  function getCardsPerView() {
    if (window.innerWidth < 640) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  }

  function updateCarousel() {
    const perView = getCardsPerView();
    const maxPos = Math.max(0, featured.length - perView);
    position = Math.min(position, maxPos);
    const cardWidth = track.parentElement.offsetWidth / perView;
    track.style.transform = `translateX(-${position * cardWidth}px)`;
  }

  if (prevBtn) prevBtn.addEventListener('click', () => { position = Math.max(0, position - 1); updateCarousel(); });
  if (nextBtn) nextBtn.addEventListener('click', () => { const perView = getCardsPerView(); position = Math.min(featured.length - perView, position + 1); updateCarousel(); });

  updateCarousel();
  window.addEventListener('resize', debounce(updateCarousel, 150));
}

/* ─── Home Page: Neighborhoods ─── */

function initNeighborhoods() {
  const grid = document.getElementById('neighborhoods-grid');
  if (!grid || typeof NEIGHBORHOODS === 'undefined') return;

  NEIGHBORHOODS.forEach(n => {
    const card = document.createElement('div');
    card.className = 'neighborhood-card';
    card.innerHTML = `
      <img src="${n.image}" alt="${n.name}" loading="lazy">
      <div class="neighborhood-card__overlay">
        <h3>${n.name}</h3>
        <p>${n.city}, ${n.state}</p>
        <span>${n.properties} Properties</span>
      </div>
    `;
    card.addEventListener('click', () => {
      window.location.href = `listings.html?location=${encodeURIComponent(n.city)}`;
    });
    grid.appendChild(card);
  });
}

/* ─── Home Page: Testimonials ─── */

function initTestimonials() {
  const container = document.getElementById('testimonials-container');
  if (!container || typeof TESTIMONIALS === 'undefined') return;

  TESTIMONIALS.forEach(t => {
    const card = document.createElement('div');
    card.className = 'testimonial-card';
    card.innerHTML = `
      <div class="testimonial-card__stars">
        ${'<i class="fas fa-star"></i>'.repeat(t.rating)}
      </div>
      <p class="testimonial-card__text">"${t.text}"</p>
      <div class="testimonial-card__author">
        <div class="testimonial-avatar">${t.photo ? `<img src="${t.photo}" alt="${t.name}">` : '<i class="fas fa-user-circle"></i>'}</div>
        <div>
          <strong>${t.name}</strong>
          <span>${t.location}</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

/* ─── Home Page: Stats Counter ─── */

function initStatsCounter() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count);
        let current = 0;
        const step = Math.ceil(target / 60);
        const timer = setInterval(() => {
          current += step;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          el.textContent = current.toLocaleString() + (el.dataset.suffix || '');
        }, 25);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

/* ─── Listings Page: Search & Filter Engine ─── */

function initListingsPage() {
  const grid = document.getElementById('listings-grid');
  const countEl = document.getElementById('results-count');
  if (!grid) return;

  // Read URL params for initial filter
  const params = new URLSearchParams(window.location.search);
  const initialLocation = params.get('location') || '';
  const locationInput = document.getElementById('filter-location');
  if (locationInput && initialLocation) locationInput.value = initialLocation;

  function getFilters() {
    return {
      location: (document.getElementById('filter-location')?.value || '').toLowerCase().trim(),
      minPrice: parseInt(document.getElementById('filter-min-price')?.value) || 0,
      maxPrice: parseInt(document.getElementById('filter-max-price')?.value) || Infinity,
      type: document.getElementById('filter-type')?.value || '',
      beds: parseInt(document.getElementById('filter-beds')?.value) || 0,
      baths: parseInt(document.getElementById('filter-baths')?.value) || 0,
      sort: document.getElementById('filter-sort')?.value || 'featured'
    };
  }

  function filterProperties() {
    const f = getFilters();
    let results = PROPERTIES.filter(p => {
      if (f.location && !(p.city.toLowerCase().includes(f.location) || p.state.toLowerCase().includes(f.location) || p.address.toLowerCase().includes(f.location) || p.zip.includes(f.location))) return false;
      if (p.price < f.minPrice) return false;
      if (p.price > f.maxPrice) return false;
      if (f.type && p.type !== f.type) return false;
      if (f.beds && p.beds < f.beds) return false;
      if (f.baths && p.baths < f.baths) return false;
      return true;
    });

    // Sort
    switch (f.sort) {
      case 'price-asc': results.sort((a, b) => a.price - b.price); break;
      case 'price-desc': results.sort((a, b) => b.price - a.price); break;
      case 'newest': results.sort((a, b) => b.yearBuilt - a.yearBuilt); break;
      case 'largest': results.sort((a, b) => b.sqft - a.sqft); break;
      default: results.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)); break;
    }

    return results;
  }

  function renderListings() {
    const results = filterProperties();
    grid.innerHTML = '';

    if (results.length === 0) {
      grid.innerHTML = `
        <div class="no-results">
          <i class="fas fa-search"></i>
          <h3>No properties found</h3>
          <p>Try adjusting your search criteria</p>
        </div>
      `;
    } else {
      results.forEach(p => grid.appendChild(createPropertyCard(p)));
    }

    if (countEl) countEl.textContent = `${results.length} ${results.length === 1 ? 'property' : 'properties'} found`;

    // Update map markers if map exists
    if (typeof updateMapMarkers === 'function') {
      updateMapMarkers(results);
    }
  }

  // Attach filter listeners
  const filterInputs = document.querySelectorAll('.filter-control');
  filterInputs.forEach(input => {
    input.addEventListener('change', renderListings);
    input.addEventListener('input', debounce(renderListings, 300));
  });

  // Clear filters button
  const clearBtn = document.getElementById('clear-filters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      filterInputs.forEach(input => {
        if (input.tagName === 'SELECT') input.selectedIndex = 0;
        else input.value = '';
      });
      renderListings();
    });
  }

  // Initial render
  renderListings();
}

/* ─── Contact Form Handler ─── */

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = form.querySelector('.form-message');
    msg.textContent = 'Thank you for your message! We will get back to you within 24 hours.';
    msg.className = 'form-message success';
    form.reset();
  });
}

/* ─── Newsletter Form ─── */

function initNewsletter() {
  const form = document.getElementById('newsletter-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = form.querySelector('.form-message') || document.createElement('div');
    msg.className = 'form-message success';
    msg.textContent = 'Thank you for subscribing!';
    if (!form.querySelector('.form-message')) form.appendChild(msg);
    form.querySelector('input[type="email"]').value = '';
  });
}

/* ─── Services Page: FAQ Accordion ─── */

function initAccordion() {
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const body = item.querySelector('.accordion-body');
      const isOpen = item.classList.contains('active');

      // Close all
      document.querySelectorAll('.accordion-item.active').forEach(a => {
        a.classList.remove('active');
        a.querySelector('.accordion-body').style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add('active');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });
}

/* ─── About Page: Team Grid ─── */

function initTeamGrid() {
  const grid = document.getElementById('team-grid');
  if (!grid || typeof TEAM_MEMBERS === 'undefined') return;

  TEAM_MEMBERS.forEach(member => {
    const card = document.createElement('div');
    card.className = 'team-card';
    card.innerHTML = `
      <div class="team-card__photo">
        ${member.photo ? `<img src="${member.photo}" alt="${member.name}">` : '<i class="fas fa-user-circle"></i>'}
      </div>
      <h3>${member.name}</h3>
      <span class="team-card__role">${member.role}</span>
      <div class="team-card__stats">
        <div><strong>${member.experience || 'N/A'}</strong><span>Experience</span></div>
        ${member.sales && member.sales !== 'N/A' ? `<div><strong>${member.sales}</strong><span>In past year</span></div>` : ''}
      </div>
      <p class="team-card__bio">${member.bio}</p>
      <div class="team-card__contact">
        <a href="tel:${member.phone}"><i class="fas fa-phone"></i></a>
        <a href="mailto:${member.email}"><i class="fas fa-envelope"></i></a>
      </div>
    `;
    grid.appendChild(card);
  });
}

/* ─── Services Page: Service Cards ─── */

function initServiceCards() {
  const grid = document.getElementById('services-grid');
  if (!grid || typeof SERVICES === 'undefined') return;

  SERVICES.forEach(service => {
    const card = document.createElement('div');
    card.className = 'service-card';
    card.innerHTML = `
      <div class="service-card__icon"><i class="fas ${service.icon}"></i></div>
      <h3>${service.title}</h3>
      <p>${service.description}</p>
      <ul class="service-card__features">
        ${service.features.map(f => `<li><i class="fas fa-check"></i> ${f}</li>`).join('')}
      </ul>
    `;
    grid.appendChild(card);
  });
}

/* ─── Hero Search Bar (Home Page) ─── */

function initHeroSearch() {
  const form = document.getElementById('hero-search-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const location = form.querySelector('[name="location"]').value;
    const type = form.querySelector('[name="type"]')?.value || '';
    const params = new URLSearchParams();
    if (location) params.set('location', location);
    if (type) params.set('type', type);
    window.location.href = `listings.html?${params.toString()}`;
  });
}

/* ─── Scroll Animations ─── */

function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
}

/* ─── Listings Toggle: Grid / List View ─── */

function initViewToggle() {
  const gridBtn = document.getElementById('view-grid');
  const listBtn = document.getElementById('view-list');
  const grid = document.getElementById('listings-grid');
  if (!gridBtn || !listBtn || !grid) return;

  gridBtn.addEventListener('click', () => {
    grid.className = 'listings-grid grid-view';
    gridBtn.classList.add('active');
    listBtn.classList.remove('active');
  });

  listBtn.addEventListener('click', () => {
    grid.className = 'listings-grid list-view';
    listBtn.classList.add('active');
    gridBtn.classList.remove('active');
  });
}

/* ─── Filter Sidebar Toggle (Mobile) ─── */

function initFilterToggle() {
  const toggleBtn = document.getElementById('filter-toggle');
  const sidebar = document.getElementById('filter-sidebar');
  if (!toggleBtn || !sidebar) return;

  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('active');
    toggleBtn.classList.toggle('active');
  });
}

function initHeroTabs() {
  const tabs = document.querySelectorAll('.hero-tab');
  const panes = document.querySelectorAll('.hero-pane');
  if (!tabs.length || !panes.length) return;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetPaneId = tab.getAttribute('data-tab');

      // ── "Just Sold" → redirect to dedicated page ──
      if (targetPaneId === 'pane-justsold') {
        window.location.href = 'sold-homes.html';
        return;
      }

      // 1. Toggle active visual state on tabs
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // 2. Hide all panes, show target pane
      panes.forEach(pane => {
        pane.classList.remove('active');
        if (pane.id === targetPaneId) {
          pane.classList.add('active');
          const firstInput = pane.querySelector('input[type="text"]');
          if (firstInput && !window.matchMedia('(max-width: 768px)').matches) {
            firstInput.focus();
          }
        }
      });

      // 3. Filter carousel by category when Buy or Rent is clicked
      if (targetPaneId === 'pane-buy') {
        filterCarouselByCategory('buy');
      } else if (targetPaneId === 'pane-rent') {
        filterCarouselByCategory('rent');
      }
    });
  });

  // ── Sell tab button handlers ──
  const sellPane = document.getElementById('pane-sell');
  if (sellPane) {
    const sellBtns = sellPane.querySelectorAll('.btn');
    sellBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Scroll to contact section or redirect to services
        const contactSection = document.getElementById('testimonials') || document.querySelector('.cta-section');
        if (btn.textContent.includes('Agent')) {
          window.location.href = 'about.html';
        } else {
          window.location.href = 'services.html';
        }
      });
    });
  }

  // ── Pre-approval "Get Started" button handler ──
  const preapprovalPane = document.getElementById('pane-preapproval');
  if (preapprovalPane) {
    const getStartedBtn = preapprovalPane.querySelector('.btn--primary');
    if (getStartedBtn) {
      getStartedBtn.addEventListener('click', () => {
        window.location.href = 'contact.html';
      });
    }
  }

  // ── Home Value "Get Estimate" button handler ──
  const homeValuePane = document.getElementById('pane-homevalue');
  if (homeValuePane) {
    const estimateBtn = homeValuePane.querySelector('.btn--primary');
    if (estimateBtn) {
      estimateBtn.addEventListener('click', () => {
        const input = homeValuePane.querySelector('input');
        if (input && input.value.trim()) {
          alert(`Home valuation requested for: "${input.value.trim()}"\n\nOur agent will contact you within 24 hours with a detailed market analysis.`);
          input.value = '';
        } else if (input) {
          input.focus();
          input.style.outline = '2px solid var(--color-primary)';
          setTimeout(() => input.style.outline = '', 2000);
        }
      });
    }
  }
}

/* ─── Carousel Filtering by Category ─── */

/**
 * Re-renders the featured carousel to only show properties
 * matching the given category (buy / rent).
 */
function filterCarouselByCategory(category) {
  const track = document.getElementById('carousel-track');
  if (!track || typeof PROPERTIES === 'undefined') return;

  // Clear current cards
  track.innerHTML = '';

  // Filter properties
  const filtered = PROPERTIES.filter(p => {
    if (category === 'buy') return p.category === 'buy' && p.featured;
    if (category === 'rent') return p.category === 'rent';
    return p.featured;
  });

  // If no featured results, show all of that category
  const results = filtered.length > 0 ? filtered : PROPERTIES.filter(p => p.category === category);

  results.forEach(p => track.appendChild(createPropertyCard(p)));

  // Reset carousel position
  track.style.transform = 'translateX(0)';

  // Update section header
  const sectionHeader = document.querySelector('#featured .section-header h2');
  if (sectionHeader) {
    if (category === 'rent') {
      sectionHeader.textContent = 'Available Rentals';
    } else {
      sectionHeader.textContent = 'Handpicked Homes for You';
    }
  }

  const sectionDesc = document.querySelector('#featured .section-header p');
  if (sectionDesc) {
    if (category === 'rent') {
      sectionDesc.textContent = 'Explore our curated selection of premium rental properties across top neighborhoods.';
    } else {
      sectionDesc.textContent = 'Explore our curated selection of premium properties, chosen by our expert agents for their exceptional value and appeal.';
    }
  }
}

/* ─── Split Section Image Float Reveal ─── */

/**
 * Staggered entrance for floating image tiles inside split sections.
 * Waits until the parent panel enters the viewport, then fades and
 * slides the float tile in with a short delay.
 */
function initSplitSections() {
  const floats = document.querySelectorAll('.split-img-float');
  if (!floats.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Slight delay driven by --delay CSS custom property on the element
        const delay = parseFloat(getComputedStyle(entry.target).getPropertyValue('--delay') || '0') * 1000;
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, delay);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  floats.forEach(f => {
    // Start hidden and shifted down
    f.style.opacity = '0';
    f.style.transform = 'translateY(24px)';
    f.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(f);
  });
}

/* ─── Master Initialization ─── */

document.addEventListener('DOMContentLoaded', () => {
  // Common
  initMobileNav();
  initSmoothScroll();
  initStickyHeader();
  initModals();
  initAuth();
  initNewsletter();
  initScrollAnimations();

  // Page-specific
  initHeroSearch();
  initHeroTabs();
  initSplitSections();
  initCarousel();
  initNeighborhoods();
  initTestimonials();
  initStatsCounter();
  initListingsPage();
  initViewToggle();
  initFilterToggle();
  initContactForm();
  initAccordion();
  initTeamGrid();
  initServiceCards();
});
