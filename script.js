document.getElementById("fileInput").addEventListener("change", handleFile);

let salesData = []; // لتخزين البيانات بعد رفع الملف

function handleFile(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        // قراءة أول شيت
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        processExcelData(jsonData);
    };

    reader.readAsArrayBuffer(file);
}

function processExcelData(data) {
    // تخطي الصف الأول إذا كان مدمجًا
    const headers = data[0].some(cell => cell === null) ? data[1] : data[0];
    const rows = data.slice(headers === data[1] ? 2 : 1);

    const distributorColumns = {
        "Territory Name": "Territory",
        "Product Name": "Product",
        "Sales": "Sales",
        "Item Name": "Product",
        "QTY": "Sales",
        "ZONE_NAME": "Territory",
        "PRODUCT_NAME": "Product",
        "NET_QUANTITY": "Sales",
    };

    const columns = {};
    headers.forEach((header, index) => {
        if (distributorColumns[header]) {
            columns[distributorColumns[header]] = index;
        }
    });

    salesData = rows.map(row => ({
        Territory: row[columns["Territory"]],
        Product: row[columns["Product"]],
        Sales: Number(row[columns["Sales"]]) || 0,
    }));

    populateFilters();
}

function populateFilters() {
    const territories = [...new Set(salesData.map(row => row.Territory))].sort();
    const products = [...new Set(salesData.map(row => row.Product))].sort();

    populateDropdown("territory", territories);
    populateDropdown("product", products);
}

function populateDropdown(id, options) {
    const select = document.getElementById(id);
    select.innerHTML = '<option>Search</option>';
    options.forEach(option => {
        const opt = document.createElement("option");
        opt.value = option;
        opt.textContent = option;
        select.appendChild(opt);
    });
}

document.getElementById("filterButton").addEventListener("click", filterData);

function filterData() {
    const selectedTerritories = Array.from(document.getElementById("territory").selectedOptions).map(opt => opt.value);
    const selectedProducts = Array.from(document.getElementById("product").selectedOptions).map(opt => opt.value);

    const filteredData = salesData.filter(row =>
        (selectedTerritories.includes(row.Territory) || selectedTerritories.includes("Search")) &&
        (selectedProducts.includes(row.Product) || selectedProducts.includes("Search"))
    );

    const groupedData = filteredData.reduce((acc, row) => {
        const key = `${row.Territory}-${row.Product}`;
        if (!acc[key]) {
            acc[key] = { Territory: row.Territory, Product: row.Product, Sales: 0 };
        }
        acc[key].Sales += row.Sales;
        return acc;
    }, {});

    displayResults(Object.values(groupedData));
}

function displayResults(data) {
    const table = document.getElementById("resultTable");
    const tbody = table.querySelector("tbody");
    tbody.innerHTML = "";

    data.forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${row.Territory}</td>
            <td>${row.Product}</td>
            <td>${row.Sales}</td>
        `;
        tbody.appendChild(tr);
    });

    table.style.display = data.length ? "block" : "none";
}