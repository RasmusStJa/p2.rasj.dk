function openProject(projectName) {
    document.getElementById('modalTitle').innerText = projectName;
    // You could load project-specific content here too
    document.getElementById('projectModal').style.display = 'block';
  }
  
function closeModal() {
    document.getElementById('projectModal').style.display = 'none';
  }
    
function toggleFollow(button) {
    if (button.classList.contains('following')) {
      button.classList.remove('following');
      button.textContent = '+ Follow';
    } else {
      button.classList.add('following');
      button.textContent = '- Follow';
    }
  }
  