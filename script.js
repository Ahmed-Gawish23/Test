document.addEventListener("DOMContentLoaded", () => {
    $('.filter-select').select2({
        placeholder: "Select an option",
        allowClear: true,
    });
});

let excelData = [];

function parseExcel(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

        processSheetData(sheetData);
    };
    reader.readAsArrayBuffer(file);
}

function processSheetData(sheetData) {
    let headers = sheetData.find(row => !row.some(cell => typeof cell === "undefined"));
    let contentStartIndex = sheetData.indexOf(headers) + 1;

    const mapping = {
        "PharmaOverseas": { territory: "Territory Name", product: "Product Name", qty: "Sales" },
        "Ibnsina": { territory: "Territory Name", product: "Item Name", qty: "QTY" },
        "ABOU KIR": { territory: "ZONE_NAME", product: "PRODUCT_NAME", qty: "NET_QUANTITY" },
    };

    let distributorType = detectDistributor(headers, mapping);

    if (!distributorType) {
        alert("Unknown distributor format.");
        return;
    }

    const { territory, product, qty } = mapping[distributorType];

    excelData = sheetData.slice(contentStartIndex).map(row => ({
        territory: row[headers.indexOf(territory)],
        product: row[headers.indexOf(product)],
        qty: parseInt(row[headers.indexOf(qty)]) || 0,
    }));

    populateFilters();
}

function detectDistributor(headers, mapping) {
    return Object.keys(mapping).find(key =>
        headers.includes(mapping[key].territory) &&
        headers.includes(mapping[key].product) &&
        headers.includes(mapping[key].qty)
    );
}

function populateFilters() {
    const territories = [...new Set(excelData.map(row => row.territory))].sort();
    const products = [...new Set(excelData.map(row => row.product))].sort();

    populateSelect("#territorySelect", territories);
    populateSelect("#productSelect", products);
}

function populateSelect(selector, options) {
    const select = document.querySelector(selector);
    select.innerHTML = "<option></option>";
    options.forEach(option => {
        const opt = document.createElement("option");
        opt.value = option;
        opt.textContent = option;
        select.appendChild(opt);
    });
}

function filterData() {
    const selectedTerritory = document.querySelector("#territorySelect").value;
    const selectedProduct = document.querySelector("#productSelect").value;

    const filteredData = excelData.filter(row =>
        (!selectedTerritory || row.territory === selectedTerritory) &&
        (!selectedProduct || row.product === selectedProduct)
    );

    displayData(filteredData);
}

function displayData(data) {
    const table = document.querySelector("#outputTable");
    table.innerHTML = "";

    if (data.length === 0) {
        table.innerHTML = "<tr><td colspan='3'>No data found</td></tr>";
        return;
    }

    const groupedData = data.reduce((acc, row) => {
        const key = `${row.territory}-${row.product}`;
        if (!acc[key]) acc[key] = { ...row, qty: 0 };
        acc[key].qty += row.qty;
        return acc;
    }, {});

    const rows = Object.values(groupedData);
    const headerRow = document.createElement("tr");
    ["Territory", "Product", "Total Quantity"].forEach(text => {
        const th = document.createElement("th");
        th.textContent = text;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    rows.forEach(row => {
        const tr = document.createElement("tr");
        ["territory", "product", "qty"].forEach(key => {
            const td = document.createElement("td");
            td.textContent = row[key];
            tr.appendChild(td);
        });
        table.appendChild(tr);
    });
}

document.getElementById("fileInput").addEventListener("change", event => {
    const file = event.target.files[0];
    if (file) parseExcel(file);
});