const interactiveItems = document.querySelectorAll('.process-card, .product-card');
const modal = document.getElementById('processModal');
const closeModal = document.getElementById('closeModal');
const modalImg = document.getElementById('modalImg');
const modalNum = document.getElementById('modalNum');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');

interactiveItems.forEach(item => {
  item.addEventListener('click', () => {
    const title = item.getAttribute('data-title');
    const desc = item.getAttribute('data-desc');
    const img = item.getAttribute('data-img');
    const num = item.getAttribute('data-num');

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
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  });
});

closeModal.addEventListener('click', () => {
  modal.classList.remove('active');
  document.body.style.overflow = 'auto'; // Restore scrolling
});

// Close when clicking outside of the modal content
modal.addEventListener('click', (e) => {
  if (e.target === modal || e.target.classList.contains('modal-overlay')) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
});
