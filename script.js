let data = [];
let columnMap = {};

document.getElementById('file-input').addEventListener('change', handleFile);

function handleFile(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const workbook = XLSX.read(e.target.result, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const sheetData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            processSheetData(sheetData);
        };
        reader.readAsBinaryString(file);
    }
}

function processSheetData(sheetData) {
    const firstValidRow = sheetData.findIndex(row => Array.isArray(row) && row.some(cell => cell));
    const headers = sheetData[firstValidRow];
    data = sheetData.slice(firstValidRow + 1).map(row =>
        row.reduce((acc, value, index) => {
            acc[headers[index]] = value;
            return acc;
        }, {})
    );

    columnMap = mapColumns(headers);
    populateFilters(data, columnMap);

    document.getElementById('filter-container').style.display = 'block';
}

function mapColumns(headers) {
    const mappings = {
        'Territory Name': 'territory',
        'ZONE_NAME': 'territory',
        'Product Name': 'product',
        'Item Name': 'product',
        'PRODUCT_NAME': 'product',
        'Sales': 'sales',
        'QTY': 'sales',
        'NET_QUANTITY': 'sales'
    };

    return headers.reduce((map, header) => {
        if (mappings[header]) map[mappings[header]] = header;
        return map;
    }, {});
}

function populateFilters(data, columns) {
    const territories = [...new Set(data.map(row => row[columns.territory]).filter(Boolean))].sort();
    const products = [...new Set(data.map(row => row[columns.product]).filter(Boolean))].sort();

    populateCheckboxList('territory-list', territories);
    populateCheckboxList('product-list', products);

    setupSearch('territory-search', 'territory-list');
    setupSearch('product-search', 'product-list');
}

function populateCheckboxList(containerId, items) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    items.forEach(item => {
        const div = document.createElement('div');
        div.classList.add('checkbox-item');
        div.innerHTML = `
            <input type="checkbox" value="${item}" id="${item}">
            <label for="${item}">${item}</label>
        `;
        container.appendChild(div);
    });
}

function setupSearch(inputId, listId) {
    const input = document.getElementById(inputId);
    const list = document.getElementById(listId);

    input.addEventListener('input', () => {
        const searchValue = input.value.toLowerCase();
        Array.from(list.children).forEach(item => {
            const label = item.querySelector('label').textContent.toLowerCase();
            item.style.display = label.includes(searchValue) ? '' : 'none';
        });
    });
}

function getSelectedCheckboxValues(containerId) {
    const container = document.getElementById(containerId);
    return Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
}

document.getElementById('filter-btn').addEventListener('click', filterData);

function filterData() {
    const selectedTerritories = getSelectedCheckboxValues('territory-list');
    const selectedProducts = getSelectedCheckboxValues('product-list');

    const filtered = data.filter(row =>
        selectedTerritories.includes(row[columnMap.territory]) &&
        selectedProducts.includes(row[columnMap.product])
    );

    const aggregatedData = aggregateData(filtered, columnMap);

    displayFilteredData(aggregatedData);
}

function aggregateData(filteredData, columns) {
    const aggregation = {};

    filteredData.forEach(row => {
        const key = `${row[columns.territory]}|${row[columns.product]}`;
        if (!aggregation[key]) {
            aggregation[key] = { territory: row[columns.territory], product: row[columns.product], sales: 0 };
        }
        aggregation[key].sales += +row[columns.sales] || 0;
    });

    return Object.values(aggregation);
}

function displayFilteredData(data) {
    const table = document.getElementById('filtered-data-table');
    const tbody = table.querySelector('tbody');

    tbody.innerHTML = '';
    data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${row.territory}</td>
            <td>${row.product}</td>
            <td>${row.sales}</td>
        `;
        tbody.appendChild(tr);
    });

    table.style.display = 'table';
}