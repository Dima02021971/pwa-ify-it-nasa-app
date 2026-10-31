
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const fetchBtn = document.getElementById('getImagesBtn');
const gallery = document.getElementById('gallery');

const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');

// Set up the existing date pickers
setupDateInputs(startInput, endInput);

// NASA's new APOD Basic API
const BASE_URL =
  'https://science.nasa.gov/wp-json/wp/v2/apod-basic';

// Convert YYYY-MM-DD into YYMMDD
function convertDate(date) {
  return date.slice(2).replaceAll('-', '');
}

// Check that a URL is safe to use
function safeUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol)
      ? url.href
      : '';
  } catch {
    return '';
  }
}

// Get a usable image URL
function getImageUrl(item) {
  return safeUrl(item.hdurl || '');
}

// Convert NASA's HTML explanation into plain text
function cleanExplanation(html) {
  const doc = new DOMParser().parseFromString(
    html || '',
    'text/html'
  );
  return doc.body.textContent.trim();
}

// Fetch images when the button is clicked
fetchBtn.addEventListener('click', () => {
  const startDate = startInput.value;
  const endDate = endInput.value;

  if (!startDate || !endDate) {
    renderMessage('Please select both dates.');
    return;
  }

  const start = new Date(startDate + 'T12:00:00');
  const end = new Date(endDate + 'T12:00:00');

  const days = Math.round(
    (end - start) / 86400000
  ) + 1;

  if (days !== 9) {
    renderMessage(
      'Please select exactly 9 consecutive days.'
    );
    return;
  }

  fetchApodRange(startDate, endDate);
});

// Request data from NASA
async function fetchApodRange(startDate, endDate) {
  renderMessage('🚀 Loading NASA space images...');
  fetchBtn.disabled = true;

  try {
    const startCode = convertDate(startDate);
    const endCode = convertDate(endDate);

    const url =
      `${BASE_URL}?date_from=${startCode}` +
      `&date_to=${endCode}&per_page=9`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `NASA API error: ${response.status}`
      );
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('Unexpected NASA API response');
    }

    const sorted = data.sort(
      (a, b) => b.date.localeCompare(a.date)
    );

    renderGallery(sorted);

  } catch (error) {
    console.error('NASA API error:', error);

    renderMessage(
      'Unable to load NASA images. Please try again.'
    );
  } finally {
    fetchBtn.disabled = false;
  }
}

// Display gallery cards
function renderGallery(items) {
  gallery.replaceChildren();

  if (items.length === 0) {
    renderMessage('No astronomy images found.');
    return;
  }

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'gallery-item';
    card.tabIndex = 0;
    card.setAttribute('role', 'button');

    const imageUrl = getImageUrl(item);

    if (item.media_type === 'image' && imageUrl) {
      const img = document.createElement('img');
      img.src = imageUrl;
      img.alt = item.title || 'NASA astronomy image';
      img.loading = 'lazy';
      card.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'video-placeholder';
      placeholder.textContent =
        item.media_type === 'image'
          ? '🌌 Image unavailable'
          : '🎬 View space media';
      card.appendChild(placeholder);
    }

    const details = document.createElement('p');
    const title = document.createElement('strong');

    title.textContent = item.title || 'NASA Astronomy';
    details.appendChild(title);
    details.appendChild(document.createElement('br'));
    details.appendChild(
      document.createTextNode(item.date || '')
    );

    card.appendChild(details);

    card.addEventListener('click', () => openModal(item));

    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openModal(item);
      }
    });

    gallery.appendChild(card);
  });
}

// Display loading and error messages
function renderMessage(message) {
  gallery.replaceChildren();

  const placeholder = document.createElement('div');
  placeholder.className = 'placeholder';

  const icon = document.createElement('div');
  icon.className = 'placeholder-icon';
  icon.textContent = '🔭';

  const text = document.createElement('p');
  text.textContent = message;

  placeholder.append(icon, text);
  gallery.appendChild(placeholder);
}

// Open full-size image modal
function openModal(item) {
  modalBody.replaceChildren();

  const imageUrl = getImageUrl(item);

  if (item.media_type === 'image' && imageUrl) {
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = item.title || 'NASA image';
    modalBody.appendChild(img);
  } else {
    const link = document.createElement('a');
    link.href = safeUrl(item.permalink || item.url) || '#';
    link.textContent = 'View this entry on NASA';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    modalBody.appendChild(link);
  }

  const heading = document.createElement('h2');
  heading.textContent = item.title || 'NASA Astronomy';

  const date = document.createElement('p');
  date.className = 'modal-date';
  date.textContent = item.date || '';

  const explanation = document.createElement('p');
  explanation.textContent =
    cleanExplanation(item.explanation);

  modalBody.append(heading, date, explanation);

  modal.classList.remove('hidden');
}

// Close modal
modalClose.addEventListener('click', () => {
  modal.classList.add('hidden');
});

modal.addEventListener('click', event => {
  if (event.target === modal) {
    modal.classList.add('hidden');
  }
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    modal.classList.add('hidden');
  }
});
