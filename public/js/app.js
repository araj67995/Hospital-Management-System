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

document.addEventListener('click', (event) => {
  const addButton = event.target.closest('[data-add-medicine]');
  const removeButton = event.target.closest('[data-remove-medicine]');

  if (addButton) {
    const list = document.querySelector('[data-medicine-list]');
    const index = list.querySelectorAll('[data-medicine-row]').length;
    const row = document.createElement('div');
    row.className = 'medicine-row';
    row.dataset.medicineRow = '';
    row.innerHTML = `
      <input class="form-control" name="medicines[${index}][name]" placeholder="Medicine" required>
      <input class="form-control" name="medicines[${index}][dosage]" placeholder="Dosage">
      <input class="form-control" type="number" name="medicines[${index}][days]" placeholder="Days">
      <label><input type="checkbox" name="medicines[${index}][morning]" value="true"> Morning</label>
      <label><input type="checkbox" name="medicines[${index}][afternoon]" value="true"> Afternoon</label>
      <label><input type="checkbox" name="medicines[${index}][night]" value="true"> Night</label>
      <input class="form-control" name="medicines[${index}][instructions]" placeholder="Instructions">
      <button class="btn btn-outline-danger btn-sm" type="button" data-remove-medicine><i class="fa-solid fa-trash"></i></button>
    `;
    list.appendChild(row);
  }

  if (removeButton) {
    const rows = document.querySelectorAll('[data-medicine-row]');
    if (rows.length > 1) removeButton.closest('[data-medicine-row]').remove();
  }
});

document.querySelectorAll('[data-max-checks]').forEach((group) => {
  group.addEventListener('change', () => {
    const max = Number(group.dataset.maxChecks || 0);
    if (!max) return;
    const checked = group.querySelectorAll('input[type="checkbox"]:checked');
    if (checked.length > max) {
      checked[checked.length - 1].checked = false;
      if (window.Swal) Swal.fire({ icon: 'info', title: `Choose only ${max}` });
    }
  });
});

function syncRefDetail(select) {
  const detailInput = select.parentElement.querySelector('[data-ref-detail]');
  if (!detailInput) return;
  detailInput.value = select.selectedOptions[0]?.dataset.detail || '';
}

document.querySelectorAll('[data-ref-select]').forEach((select) => {
  syncRefDetail(select);
  select.addEventListener('change', () => syncRefDetail(select));
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
