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

    const territoryCheckboxes = document.getElementById("territoryCheckboxes");
    const productCheckboxes = document.getElementById("productCheckboxes");

    territoryCheckboxes.innerHTML = "";
    productCheckboxes.innerHTML = "";

    // Create checkboxes for Territory
    territorySet.forEach(value => {
        const div = document.createElement("div");
        div.innerHTML = `<input type="checkbox" id="territory_${value}" value="${value}"> <label for="territory_${value}">${value}</label>`;
        territoryCheckboxes.appendChild(div);
    });

    // Create checkboxes for Product
    productSet.forEach(value => {
        const div = document.createElement("div");
        div.innerHTML = `<input type="checkbox" id="product_${value}" value="${value}"> <label for="product_${value}">${value}</label>`;
        productCheckboxes.appendChild(div);
    });

    // Enable search functionality for territory and product checkboxes
    $("#territorySearch").autocomplete({
        source: [...territorySet],
        minLength: 2,
        select: function(event, ui) {
            $("#territorySearch").val(ui.item.value);
            filterCheckboxes('territory', ui.item.value);
        }
    });

    $("#productSearch").autocomplete({
        source: [...productSet],
        minLength: 2,
        select: function(event, ui) {
            $("#productSearch").val(ui.item.value);
            filterCheckboxes('product', ui.item.value);
        }
    });
}

function filterCheckboxes(type, searchText) {
    const checkboxes = document.querySelectorAll(`#${type}Checkboxes input`);
    checkboxes.forEach(checkbox => {
        const label = checkbox.nextElementSibling.textContent;
        if (label.toLowerCase().includes(searchText.toLowerCase())) {
            checkbox.parentElement.style.display = 'block';
        } else {
            checkbox.parentElement.style.display = 'none';
        }
    });
}

document.getElementById("filter