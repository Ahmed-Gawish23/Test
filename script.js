let data = [];
let columnMap = {};

document.getElementById('file-upload').addEventListener('change', handleFileUpload);

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const workbook = XLSX.read(e.target.result, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        handleHeader(rows);
    };
    reader.readAsBinaryString(file);
}

function handleHeader(rows) {
    // البحث عن الصف الذي يحتوي على الأعمدة
    const headerRowIndex = rows.findIndex(row => row.some(cell => typeof cell === 'string' && /territory|product|sales|qty|quantity|item|zone_name/i.test(cell)));
    if (headerRowIndex === -1) {
        alert('Invalid file format!');
        return;
    }

    data = rows.slice(headerRowIndex + 1);  // استخراج البيانات من بعد الصف الذي يحتوي على الأعمدة
    columnMap = detectColumns(rows[headerRowIndex]);
    populateFilters(data, columnMap);
}

function detectColumns(headerRow) {
    const map = {};
    headerRow.forEach((col, index) => {
        // البحث عن الأعمدة بناءً على الأسماء المتوقعة
        if (/territory|zone_name/i.test(col)) map.territory = index;
        if (/product|item/i.test(col)) map.product = index;
        if (/sales|qty|quantity|net_quantity/i.test(col)) map.sales = index;
    });
    return map;
}

function populateFilters(data, columns) {
    const territories = [...new Set(data.map(row => row[columns.territory]).filter(Boolean))].sort();
    const products = [...new Set(data.map(row => row[columns.product]).filter(Boolean))].sort();

    populateDropdown('territory', territories);
    populateDropdown('product', products);

    // Initialize Select2 with multiple selection and Select All option
    $('#territory, #product').select2({
        placeholder: "Select options",
        allowClear: true,
        multiple: true,
        width: 'resolve'
    });

    // Add "Select All" option for both filters
    addSelectAllOption('territory', territories);
    addSelectAllOption('product', products);
}

function addSelectAllOption(id, items) {
    const select = document.getElementById(id);
    const selectAllOption = document.createElement('option');
    selectAllOption.value = 'select-all';
    selectAllOption.textContent = 'Select All';
    selectAllOption.dataset.selectAll = true;
    select.insertBefore(selectAllOption, select.firstChild);

    // Refresh the Select2 dropdown to reflect changes
    $(select).trigger('change');
}

function populateDropdown(id, items) {
    const select = document.getElementById(id);
    select.innerHTML = ''; // Clear previous options
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        select.appendChild(option);
    });
}

document.getElementById('filter-btn').addEventListener('click', filterData);

function filterData() {
    const selectedTerritories = getSelectedValues('territory');
    const selectedProducts = getSelectedValues('product');

    const filtered = data.filter(row =>
        selectedTerritories.includes(row[columnMap.territory]) &&
        selectedProducts.includes(row[columnMap.product])
    );

    displayFilteredData(filtered);
}

function getSelectedValues(id) {
    const selectedOptions = Array.from(document.getElementById(id).selectedOptions);
    const allSelected = selectedOptions.some(opt => opt.value === 'select-all');
    const values = selectedOptions.map(opt => opt.value);

    // If "Select All" is selected, return all available values for that field
    if (allSelected) {
        const allOptions = Array.from(document.getElementById(id).options);
        return allOptions.filter(opt => opt.value !== 'select-all').map(opt => opt.value);
    }

    return values;
}

function displayFilteredData(filteredData) {
    const table = document.getElementById('filtered-data');
    const aggregatedData = aggregateData(filteredData);
    const headerRow = `
        <tr>
            <th>Territory</th>
            <th>Product</th>
            <th>Total Sales</th>
        </tr>`;
    const rows = aggregatedData.map(row =>
        `<tr>
            <td>${row.territory}</td>
            <td>${row.product}</td>
            <td>${row.totalSales}</td>
        </tr>`
    ).join('');
    table.innerHTML = `<thead>${headerRow}</thead><tbody>${rows}</tbody>`;
}

function aggregateData(data) {
    const result = {};
    data.forEach(row => {
        const key = `${row[columnMap.territory]}|${row[columnMap.product]}`;
        if (!result[key]) {
            result[key] = {
                territory: row[columnMap.territory],
                product: row[columnMap.product],
                totalSales: 0,
            };
        }
        result[key].totalSales += parseFloat(row[columnMap.sales]) || 0;
    });
    return Object.values(result);
}