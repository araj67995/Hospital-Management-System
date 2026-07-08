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
  const stockAdd = event.target.closest('[data-stock-add]');
  const billStockAdd = event.target.closest('[data-bill-stock-add]');
  const addService = event.target.closest('[data-add-service]');
  const addBillMedicine = event.target.closest('[data-add-bill-medicine]');
  const removeLine = event.target.closest('[data-remove-line]');
  const addPharmacyMedicine = event.target.closest('[data-add-pharmacy-medicine]');

  if (addButton) {
    const list = document.querySelector('[data-medicine-list]');
    const index = list.querySelectorAll('[data-medicine-row]').length;
    const row = document.createElement('div');
    row.className = 'medicine-row';
    row.dataset.medicineRow = '';
    row.innerHTML = `
      <input type="hidden" name="medicines[${index}][medicine]" data-medicine-id>
      <input class="form-control" name="medicines[${index}][name]" placeholder="Medicine" required>
      <input class="form-control" name="medicines[${index}][dosage]" placeholder="Dosage">
      <input class="form-control" type="number" min="1" name="medicines[${index}][quantity]" value="1" placeholder="Qty">
      <select class="form-select" name="medicines[${index}][unit]">${unitOptions()}</select>
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

  if (stockAdd) addPrescriptionMedicine(stockAdd);
  if (billStockAdd) addBillMedicineRow(billStockAdd);
  if (addService) addServiceRow();
  if (addBillMedicine) addBillMedicineRow();
  if (addPharmacyMedicine) addPharmacyMedicineRow();
  if (removeLine) removeLine.closest('[data-service-row], [data-bill-medicine-row], [data-pharmacy-row]').remove();
});

document.addEventListener('input', (event) => {
  if (event.target.matches('[data-stock-search]')) filterStockList(event.target);
  if (event.target.matches('[data-line-qty], [data-line-rate]')) updateLineAmount(event.target.closest('[data-service-row], [data-bill-medicine-row], [data-pharmacy-row]'));
});

document.addEventListener('change', (event) => {
  if (event.target.matches('[data-price-type]')) {
    const row = event.target.closest('[data-pharmacy-row]');
    const rate = row?.querySelector('[data-line-rate]');
    if (rate) rate.value = event.target.value === 'piece' ? event.target.dataset.pieceRate || 0 : event.target.dataset.unitRate || 0;
    updateLineAmount(row);
  }
});

function unitOptions(selected = 'Tablet') {
  return ['Tablet', 'Bottle', 'Packet', 'Strip', 'Injection', 'Other']
    .map((unit) => `<option value="${unit}" ${unit === selected ? 'selected' : ''}>${unit}</option>`)
    .join('');
}

function escapeAttr(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

function filterStockList(input) {
  const query = input.value.trim().toLowerCase();
  const scope = input.closest('.stock-picker') || document;
  scope.querySelectorAll('[data-stock-add], [data-bill-stock-add], [data-pharmacy-stock-add]').forEach((button) => {
    button.hidden = query && !button.dataset.name.toLowerCase().includes(query);
  });
}

function addPrescriptionMedicine(button) {
  const list = document.querySelector('[data-medicine-list]');
  const rows = list.querySelectorAll('[data-medicine-row]');
  const row = rows[rows.length - 1];
  const target = row && !row.querySelector('input[name$="[name]"]').value ? row : null;
  if (!target) document.querySelector('[data-add-medicine]')?.click();
  const finalRow = target || list.querySelectorAll('[data-medicine-row]')[list.querySelectorAll('[data-medicine-row]').length - 1];
  finalRow.querySelector('[data-medicine-id]').value = button.dataset.id || '';
  finalRow.querySelector('input[name$="[name]"]').value = button.dataset.name || '';
}

function addServiceRow() {
  const list = document.querySelector('[data-service-list]');
  if (!list) return;
  const index = list.querySelectorAll('[data-service-row]').length;
  const row = document.createElement('div');
  row.className = 'bill-row';
  row.dataset.serviceRow = '';
  row.innerHTML = `
    <select class="form-select" name="serviceItems[${index}][category]">
      ${['Registration', 'Consultation', 'Room', 'Checkup', 'Test', 'Surgery', 'Other'].map((category) => `<option value="${category}">${category}</option>`).join('')}
    </select>
    <input class="form-control" name="serviceItems[${index}][description]" placeholder="Description">
    <input class="form-control" type="number" min="1" name="serviceItems[${index}][quantity]" value="1" placeholder="Qty" data-line-qty>
    <input class="form-control" type="number" min="0" step="0.01" name="serviceItems[${index}][rate]" value="0" placeholder="Rate" data-line-rate>
    <input class="form-control" type="number" name="serviceItems[${index}][amount]" value="0" placeholder="Amount" data-line-amount readonly>
    <button class="btn btn-outline-danger btn-sm" type="button" data-remove-line><i class="fa-solid fa-trash"></i></button>
  `;
  list.appendChild(row);
}

function addBillMedicineRow(button) {
  const list = document.querySelector('[data-bill-medicine-list]');
  if (!list) return;
  const index = list.querySelectorAll('[data-bill-medicine-row]').length;
  const row = document.createElement('div');
  row.className = 'bill-row';
  row.dataset.billMedicineRow = '';
  const medicineName = escapeAttr(button?.dataset.name || '');
  row.innerHTML = `
    <input type="hidden" name="medicineItems[${index}][medicine]" value="${button?.dataset.id || ''}" data-medicine-id>
    <input class="form-control" name="medicineItems[${index}][name]" value="${medicineName}" placeholder="Medicine">
    <select class="form-select" name="medicineItems[${index}][unit]">${unitOptions('Packet')}</select>
    <input class="form-control" type="number" min="1" max="${button?.dataset.quantity || ''}" name="medicineItems[${index}][quantity]" value="1" placeholder="Qty" data-line-qty>
    <input class="form-control" type="number" min="0" step="0.01" name="medicineItems[${index}][rate]" value="${button?.dataset.rate || 0}" placeholder="Rate" data-line-rate>
    <input class="form-control" type="number" name="medicineItems[${index}][amount]" value="${button?.dataset.rate || 0}" placeholder="Amount" data-line-amount readonly>
    <button class="btn btn-outline-danger btn-sm" type="button" data-remove-line><i class="fa-solid fa-trash"></i></button>
  `;
  list.appendChild(row);
}

function addPharmacyMedicineRow(button) {
  const list = document.querySelector('[data-pharmacy-list]');
  if (!list) return;
  const index = list.querySelectorAll('[data-pharmacy-row]').length;
  const row = document.createElement('div');
  row.className = 'bill-row';
  row.dataset.pharmacyRow = '';
  const medicineName = escapeAttr(button?.dataset.name || '');
  const unitName = escapeAttr(button?.dataset.unit || 'Packet');
  const unitRate = button?.dataset.rate || 0;
  const pieceRate = button?.dataset.pieceRate || 0;
  row.innerHTML = `
    <input type="hidden" name="items[${index}][medicine]" value="${button?.dataset.id || ''}" data-medicine-id>
    <input class="form-control" name="items[${index}][name]" value="${medicineName}" placeholder="Medicine" required>
    <select class="form-select" name="items[${index}][unit]">${unitOptions(unitName)}</select>
    <select class="form-select" name="items[${index}][priceType]" data-price-type data-unit-rate="${unitRate}" data-piece-rate="${pieceRate}">
      <option value="unit">Per Unit</option>
      <option value="piece">Per Piece</option>
    </select>
    <input class="form-control" type="number" min="1" max="${button?.dataset.quantity || ''}" name="items[${index}][quantity]" value="1" placeholder="Qty" data-line-qty>
    <input class="form-control" type="number" min="0" step="0.01" name="items[${index}][rate]" value="${unitRate}" placeholder="Rate" data-line-rate>
    <input class="form-control" type="number" name="items[${index}][amount]" value="${unitRate}" placeholder="Amount" data-line-amount readonly>
    <button class="btn btn-outline-danger btn-sm" type="button" data-remove-line><i class="fa-solid fa-trash"></i></button>
  `;
  list.appendChild(row);
}

document.addEventListener('click', (event) => {
  const pharmacyStockAdd = event.target.closest('[data-pharmacy-stock-add]');
  if (pharmacyStockAdd) addPharmacyMedicineRow(pharmacyStockAdd);
});

function updateLineAmount(row) {
  if (!row) return;
  const qty = Number(row.querySelector('[data-line-qty]')?.value || 0);
  const rate = Number(row.querySelector('[data-line-rate]')?.value || 0);
  const amount = row.querySelector('[data-line-amount]');
  if (amount) amount.value = (qty * rate).toFixed(2);
}

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
