// Modal elements
const modal = document.getElementById('processModal');
const closeModal = document.getElementById('closeModal');
const modalImg = document.getElementById('modalImg');
const modalNum = document.getElementById('modalNum');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');

// Use event delegation on the document - this is 100% reliable
// No matter what child element is clicked, closest() finds the card parent
document.addEventListener('click', function(e) {
  const card = e.target.closest('.process-card, .product-card');
  if (!card) return; // Click was not inside a card, ignore

  // Prevent any default anchor/button behavior
  e.preventDefault();
  e.stopPropagation();

  const title = card.getAttribute('data-title');
  const desc = card.getAttribute('data-desc');
  const img = card.getAttribute('data-img');
  const num = card.getAttribute('data-num');

  modalTitle.textContent = title;
  modalDesc.textContent = desc;

  if (num) {
    modalNum.textContent = num;
    modalNum.style.display = 'block';
  } else {
    modalNum.style.display = 'none';
  }

  modalImg.style.backgroundImage = `url('${img}')`;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
});

// Close modal
closeModal.addEventListener('click', function(e) {
  e.stopPropagation();
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
});

// Close when clicking outside of the modal content
modal.addEventListener('click', function(e) {
  if (e.target === modal || e.target.classList.contains('modal-overlay')) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
});
