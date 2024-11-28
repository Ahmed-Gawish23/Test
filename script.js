document.getElementById("fileInput").addEventListener("change", handleFile);

const distributorColumns = {
    "PharmaOverseas": { territory: "Territory Name", product: "Product Name", sales: "Sales" },
    "Ibnsina": { territory: "Territory Name", product: "Item Name", sales: "QTY" },
    "ABOU KIR": { territory: "ZONE_NAME", product: "PRODUCT_NAME", sales: "NET_QUANTITY" },
};

let data = [];
let currentColumns = {};

function handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const workbook = XLSX.read(e.target.result, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

        // Skip merged header row
        const validRowIndex = sheet.findIndex(row => row.includes("Territory Name") || row.includes("ZONE_NAME"));
        const rows = sheet.slice(validRowIndex);

        const headers = rows[0];
        data = rows.slice(1).map(row => Object.fromEntries(row.map((cell, i) => [headers[i], cell])));

        detectDistributor(headers);
        populateFilters();
        document.getElementById("filterSection").classList.remove("d-none");
    };
    reader.readAsBinaryString(file);
}

function detectDistributor(headers) {
    for (const [distributor, columns] of Object.entries(distributorColumns)) {
        if (headers.includes(columns.territory)) {
            currentColumns = columns;
            break;
        }
    }
}

function populateFilters() {
    const territorySet = new Set(data.map(row => row[currentColumns.territory]));
    const productSet = new Set(data.map(row => row[currentColumns.product]));

    const territorySelect = document.getElementById("territorySelect");
    const productSelect = document.getElementById("productSelect");

    territorySelect.innerHTML = "";
    productSelect.innerHTML = "";

    [...territorySet].sort().forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        territorySelect.appendChild(option);
    });

    [...productSet].sort().forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        productSelect.appendChild(option);
    });
}

document.getElementById("filterButton").addEventListener("click", () => {
    const selectedTerritories = Array.from(document.getElementById("territorySelect").selectedOptions).map(opt => opt.value);
    const selectedProducts = Array.from(document.getElementById("productSelect").selectedOptions).map(opt => opt.value);

    const filteredData = data.filter(row =>
        selectedTerritories.includes(row[currentColumns.territory]) &&
        selectedProducts.includes(row[currentColumns.product])
    );

    const aggregatedData = {};
    filteredData.forEach(row => {
        const key = `${row[currentColumns.territory]}|${row[currentColumns.product]}`;
        aggregatedData[key] = (aggregatedData[key] || 0) + +row[currentColumns.sales];
    });

    const outputTable = document.getElementById("outputTable");
    outputTable.innerHTML = "";

    Object.entries(aggregatedData).forEach(([key, totalSales]) => {
        const [territory, product] = key.split("|");
        const row = `<tr><td>${territory}</td><td>${product}</td><td>${totalSales}</td></tr>`;
        outputTable.innerHTML += row;
    });

    document.getElementById("outputSection").classList.remove("d-none");
});