// Toggle folders
document.querySelectorAll('.folder-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('data-target');
    const folder = document.getElementById(targetId);
    const arrow = btn.querySelector('.arrow');

    if (folder.style.display === "flex") {
      folder.style.display = "none";
      arrow.textContent = "▼";
    } else {
      folder.style.display = "flex";
      folder.style.flexDirection = "column";
      arrow.textContent = "▲";
    }
  });
});

// Search functionality
document.getElementById('search').addEventListener('input', function() {
  const query = this.value.toLowerCase();
  document.querySelectorAll('.folder-card').forEach(card => {
    const files = card.querySelectorAll('.folder-files a');
    let match = false;
    files.forEach(file => {
      if (file.textContent.toLowerCase().includes(query)) {
        file.style.display = "block";
        match = true;
      } else {
        file.style.display = "none";
      }
    });
    card.style.display = match ? "block" : "none";
  });
});
