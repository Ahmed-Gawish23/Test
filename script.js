document.getElementById("excelFile").addEventListener("change", handleFile);

let data = [];
let distributors = {
    "PharmaOverseas": { territory: "Territory Name", product: "Product Name", sales: "Sales" },
    "Ibnsina": { territory: "Territory Name", product: "Item Name", sales: "QTY" },
    "ABOU KIR": { territory: "ZONE_NAME", product: "PRODUCT_NAME", sales: "NET_QUANTITY" }
};

function handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const workbook = XLSX.read(e.target.result, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        handleSheetData(jsonData);
    };
    reader.readAsBinaryString(file);
}

function handleSheetData(sheetData) {
    const headers = detectHeaders(sheetData);
    data = sheetData.slice(headers.startRow + 1).map(row => ({
        territory: row[headers.territoryIndex],
        product: row[headers.productIndex],
        sales: parseInt(row[headers.salesIndex]) || 0
    }));

    populateDropdowns(data, "territory");
    populateDropdowns(data, "product");
}

function detectHeaders(sheetData) {
    for (let i = 0; i < sheetData.length; i++) {
        const row = sheetData[i];
        const keys = Object.keys(distributors);

        for (let distributor of keys) {
            const { territory, product, sales } = distributors[distributor];
            const territoryIndex = row.indexOf(territory);
            const productIndex = row.indexOf(product);
            const salesIndex = row.indexOf(sales);

            if (territoryIndex > -1 && productIndex > -1 && salesIndex > -1) {
                return { startRow: i, territoryIndex, productIndex, salesIndex };
            }
        }
    }
    throw new Error("Headers not detected");
}

function populateDropdowns(data, key) {
    const dropdown = document.getElementById(key);
    const uniqueValues = [...new Set(data.map(item => item[key]))].sort();

    uniqueValues.forEach(value => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = value;
        dropdown.appendChild(option);
    });

    setupSearch(key, uniqueValues);
}

function setupSearch(key, options) {
    const dropdown = document.getElementById(key);
    const searchInput = document.getElementById(`${key}Search`);

    dropdown.addEventListener("change", (event) => {
        if (event.target.value === "search") {
            searchInput.style.display = "block";
            dropdown.style.display = "none";
            searchInput.focus();
        }
    });

    searchInput.addEventListener("input", () => {
        const filterValue = searchInput.value.toLowerCase();
        const filteredOptions = options.filter(option => option.toLowerCase().includes(filterValue));

        dropdown.innerHTML = `<option value="search">Search...</option>`;
        filteredOptions.forEach(value => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            dropdown.appendChild(option);
        });
    });

    searchInput.addEventListener("blur", () => {
        searchInput.style.display = "none";
        dropdown.style.display = "block";
        dropdown.selectedIndex = 0;
    });
}

document.getElementById("filterButton").addEventListener("click", () => {
    const selectedTerritories = Array.from(document.getElementById("territory").selectedOptions).map(opt => opt.value);
    const selectedProducts = Array.from(document.getElementById("product").selectedOptions).map(opt => opt.value);

    const filteredData = data.filter(item => 
        (selectedTerritories.includes(item.territory) || selectedTerritories.includes("search")) &&
        (selectedProducts.includes(item.product) || selectedProducts.includes("search"))
    );

    displayResults(filteredData);
});

function displayResults(filteredData) {
    const resultsTable = document.getElementById("resultsTable").querySelector("tbody");
    resultsTable.innerHTML = "";

    const aggregatedData = filteredData.reduce((acc, item) => {
        const key = `${item.territory}-${item.product}`;
        if (!acc[key]) {
            acc[key] = { territory: item.territory, product: item.product, sales: 0 };
        }
        acc[key].sales += item.sales;
        return acc;
    }, {});

    Object.values(aggregatedData).forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${row.territory}</td><td>${row.product}</td><td>${row.sales}</td>`;
        resultsTable.appendChild(tr);
    });
}