document.getElementById("upload").addEventListener("change", handleFile);
document.getElementById("filter-btn").addEventListener("click", filterData);

let rawData = [];
let filteredData = [];
const distributors = {
    "PharmaOverseas": { territory: "Territory Name", product: "Product Name", qty: "Sales" },
    "Ibnsina": { territory: "Territory Name", product: "Item Name", qty: "QTY" },
    "ABOU KIR": { territory: "ZONE_NAME", product: "PRODUCT_NAME", qty: "NET_QUANTITY" },
};

function handleFile(e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        processSheet(jsonData);
    };

    reader.readAsArrayBuffer(file);
}

function processSheet(sheetData) {
    // Skip merged header row
    let startRow = 0;
    while (typeof sheetData[startRow][0] === "string" && sheetData[startRow][0].includes("Header")) {
        startRow++;
    }

    const headers = sheetData[startRow];
    const distributor = identifyDistributor(headers);
    if (!distributor) {
        alert("Unrecognized sheet format.");
        return;
    }

    rawData = sheetData.slice(startRow + 1).map(row => ({
        territory: row[headers.indexOf(distributor.territory)],
        product: row[headers.indexOf(distributor.product)],
        qty: parseInt(row[headers.indexOf(distributor.qty)] || 0),
    }));

    populateFilters();
}

function identifyDistributor(headers) {
    return Object.values(distributors).find(
        dist => headers.includes(dist.territory) && headers.includes(dist.product) && headers.includes(dist.qty)
    );
}

function populateFilters() {
    const territories = [...new Set(rawData.map(row => row.territory))].sort();
    const products = [...new Set(rawData.map(row => row.product))].sort();

    const territorySelect = document.getElementById("territory-select");
    const productSelect = document.getElementById("product-select");

    territories.forEach(territory => {
        const option = document.createElement("option");
        option.value = territory;
        option.textContent = territory;
        territorySelect.appendChild(option);
    });

    products.forEach(product => {
        const option = document.createElement("option");
        option.value = product;
        option.textContent = product;
        productSelect.appendChild(option);
    });
}

function filterData() {
    const selectedTerritories = Array.from(document.getElementById("territory-select").selectedOptions).map(opt => opt.value);
    const selectedProducts = Array.from(document.getElementById("product-select").selectedOptions).map(opt => opt.value);

    filteredData = rawData.filter(row =>
        (selectedTerritories.includes("all") || selectedTerritories.includes(row.territory)) &&
        (selectedProducts.includes("all") || selectedProducts.includes(row.product))
    );

    displayData();
}

function displayData() {
    const tableBody = document.querySelector("#sales-table tbody");
    tableBody.innerHTML = "";

    const groupedData = filteredData.reduce((acc, row) => {
        const key = `${row.territory}-${row.product}`;
        if (!acc[key]) acc[key] = { territory: row.territory, product: row.product, qty: 0 };
        acc[key].qty += row.qty;
        return acc;
    }, {});

    Object.values(groupedData).forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${row.territory}</td><td>${row.product}</td><td>${row.qty}</td>`;
        tableBody.appendChild(tr);
    });
}