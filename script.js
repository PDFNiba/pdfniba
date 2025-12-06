// Toggle folder dropdown
function toggleFolder(folder) {
  const fileList = folder.querySelector('.file-list');
  const isVisible = fileList.style.display === 'block';
  fileList.style.display = isVisible ? 'none' : 'block';
}
