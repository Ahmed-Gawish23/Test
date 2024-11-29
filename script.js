document.getElementById('fileInput').addEventListener('change', handleFile);

const distributorConfigs = {
    'PharmaOverseas': { territory: 'Territory Name', product: 'Product Name', sales: 'Sales' },
    'Ibnsina': { territory: 'Territory Name', product: 'Item Name', sales: 'QTY' },
    'ABOU KIR': { territory: 'ZONE_NAME', product: 'PRODUCT_NAME', sales: 'NET_QUANTITY' },
};

function handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Find the header row
        let headerRow = rows.findIndex(row => row.some(cell => typeof cell === 'string'));
        if (headerRow === -1) {
            alert('No header found');
            return;
        }

        const headers = rows[headerRow];
        const dataRows = rows.slice(headerRow + 1);

        // Identify distributor
        const distributor = Object.keys(distributorConfigs).find(key =>
            Object.values(distributorConfigs[key]).every(header => headers.includes(header))
        );

        if (!distributor) {
            alert('Unknown distributor format.');
            return;
        }

        const config = distributorConfigs[distributor];
        const filteredData = dataRows.map(row => ({
            territory: row[headers.indexOf(config.territory)],
            product: row[headers.indexOf(config.product)],
            sales: row[headers.indexOf(config.sales)],
        })).filter(row => row.territory && row.product && row.sales);

        displayFilteredData(filteredData);
    };

    reader.readAsArrayBuffer(file);
}

function displayFilterOptions(data) {
    const territories = [...new Set(data.map(item => item.territory))].sort();
    const products = [...new Set(data.map(item => item.product))].sort();

    const territorySelect = document.getElementById('territorySelect');
    const productSelect = document.getElementById('productSelect');

    populateSelect(territorySelect, territories);
    populateSelect(productSelect, products);

    addSearchFunctionality('territorySearch', territorySelect);
    addSearchFunctionality('productSearch', productSelect);
}

function populateSelect(selectElement, items) {
    selectElement.innerHTML = '';
    items.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        selectElement.appendChild(option);
    });
}

function addSearchFunctionality(searchId, selectElement) {
    const searchInput = document.getElementById(searchId);
    searchInput.addEventListener('input', () => {
        const filter = searchInput.value.toLowerCase();
        Array.from(selectElement.options).forEach(option => {
            option.style.display = option.textContent.toLowerCase().includes(filter) ? '' : 'none';
        });
    });
}

function displayFilteredData(data) {
    displayFilterOptions(data);

    const table = document.getElementById('filteredTable');
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';

    const groupedData = data.reduce((acc, { territory, product, sales }) => {
        const key = `${territory}-${product}`;
        if (!acc[key]) acc[key] = { territory, product, sales: 0 };
        acc[key].sales += parseInt(sales, 10);
        return acc;
    }, {});

    Object.values(groupedData).forEach(({ territory, product, sales }) => {
        const row = document.createElement('tr');
        row.innerHTML = `<td>${territory}</td><td>${product}</td><td>${sales}</td>`;
        tbody.appendChild(row);
    });

    table.style.display = 'table';
}