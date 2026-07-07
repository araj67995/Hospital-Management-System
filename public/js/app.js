document.addEventListener('submit', (event) => {
  const form = event.target;
  if (form.classList.contains('needs-validation') && !form.checkValidity()) {
    event.preventDefault();
    event.stopPropagation();
  }
  if (form.classList.contains('delete-form')) {
    event.preventDefault();
    Swal.fire({
      title: 'Delete record?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d94a4a',
      confirmButtonText: 'Delete'
    }).then((result) => {
      if (result.isConfirmed) form.submit();
    });
  }
  form.classList.add('was-validated');
});

document.querySelectorAll('.data-table th').forEach((header, index) => {
  header.addEventListener('click', () => {
    const table = header.closest('table');
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    rows.sort((a, b) => a.children[index].innerText.localeCompare(b.children[index].innerText, undefined, { numeric: true }));
    rows.forEach((row) => table.querySelector('tbody').appendChild(row));
  });
});

function makeChart(id, type, labels, data, color) {
  const canvas = document.getElementById(id);
  if (!canvas || !window.Chart) return;
  new Chart(canvas, {
    type,
    data: { labels, datasets: [{ data, backgroundColor: color, borderColor: color, tension: .35 }] },
    options: { plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false }
  });
}

makeChart('patientsChart', 'line', ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], [42, 58, 61, 73, 88, 94], '#0b72b9');
makeChart('revenueChart', 'bar', ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], [18000, 25000, 22000, 31000, 42000, 51000], '#2e9f6e');
makeChart('departmentChart', 'doughnut', ['Cardiology', 'Neurology', 'Pediatrics', 'Surgery'], [30, 18, 26, 21], ['#0b72b9', '#13a8b5', '#2e9f6e', '#f0ad4e']);
