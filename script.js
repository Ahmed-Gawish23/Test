document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("file-upload").addEventListener("change", async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheet = workbook.Sheets[workbook.SheetNames[0]];

            let jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
            let validRowIndex = jsonData.findIndex(row =>
                row.includes("Territory Name") || row.includes("ZONE_NAME") ||
                row.includes("Branch Name") || row.includes("Sal. Dist. Desc.") ||
                row.includes("Item Name") || row.includes("Product Name") ||
                row.includes("PRODUCT_NAME") || row.includes("Mat. Desc.") ||
                row.includes("Sales") || row.includes("QTY") ||
                row.includes("NET_QUANTITY") || row.includes("Sales Quantity") ||
                row.includes("Quantity") || row.includes("Qty")
            );

            if (validRowIndex === -1) {
                alert("No valid data found in the file");
                return;
            }

            jsonData = jsonData.slice(validRowIndex);
            const headers = jsonData.shift();
            const validData = jsonData.map(row => {
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = row[index];
                });
                return obj;
            });

            let columnMapping = {};
            const columnNames = Object.keys(validData[0]);

            if (columnNames.includes("Product Name") && columnNames.includes("Territory Name") && columnNames.includes("Sales")) {
                columnMapping = { item: "Product Name", territory: "Territory Name", qty: "Sales" };
            } else if (columnNames.includes("Item Name") && columnNames.includes("Territory Name") && columnNames.includes("QTY")) {
                columnMapping = { item: "Item Name", territory: "Territory Name", qty: "QTY" };
            } else if (columnNames.includes("PRODUCT_NAME") && columnNames.includes("ZONE_NAME") && columnNames.includes("NET_QUANTITY")) {
                columnMapping = { item: "PRODUCT_NAME", territory: "ZONE_NAME", qty: "NET_QUANTITY" };
            } else if (columnNames.includes("Item name") && columnNames.includes("Branch Name") && columnNames.includes("Sales Quantity")) {
                columnMapping = { item: "Item name", territory: "Branch Name", qty: "Sales Quantity" };
            } else if (columnNames.includes("Mat. Desc.") && columnNames.includes("Sal. Dist. Desc.") && columnNames.includes("Qty")) {
                columnMapping = { item: "Mat. Desc.", territory: "Sal. Dist. Desc.", qty: "Qty" };
            } else if (columnNames.includes("Item Name") && columnNames.includes("Territory Name") && columnNames.includes("Quantity")) {
                columnMapping = { item: "Item Name", territory: "Territory Name", qty: "Quantity" };
            } else {
                alert("Unknown file format");
                return;
            }

            const items = [...new Set(validData.map(row => row[columnMapping.item]).filter(Boolean))].sort();
            const territories = [...new Set(validData.map(row => row[columnMapping.territory]).filter(Boolean))].sort();

            const itemSelect = document.getElementById("product");
            const territorySelect = document.getElementById("territory");

            itemSelect.innerHTML = "<option value='all'>Select All</option>";
            territorySelect.innerHTML = "<option value='all'>Select All</option>";

            items.forEach(item => {
                const option = document.createElement("option");
                option.value = item;
                option.textContent = item;
                itemSelect.appendChild(option);
            });

            territories.forEach(territory => {
                const option = document.createElement("option");
                option.value = territory;
                option.textContent = territory;
                territorySelect.appendChild(option);
            });

            $('#territory, #product').select2();

            document.getElementById("filter-btn").addEventListener("click", () => {
                const selectedItems = $('#product').val();
                const selectedTerritories = $('#territory').val();

                const filteredData = validData.filter(row =>
                    (selectedItems.includes("all") || selectedItems.includes(row[columnMapping.item])) &&
                    (selectedTerritories.includes("all") || selectedTerritories.includes(row[columnMapping.territory]))
                );

                const aggregatedData = {};
                filteredData.forEach(row => {
                    const key = `${row[columnMapping.territory]} - ${row[columnMapping.item]}`;
                    if (!aggregatedData[key]) {
                        aggregatedData[key] = { territory: row[columnMapping.territory], product: row[columnMapping.item], qty: 0 };
                    }
                    aggregatedData[key].qty += parseInt(row[columnMapping.qty], 10) || 0;
                });

                const output = document.getElementById("filtered-data");
                output.innerHTML = `
                    <tr>
                        <th>Territory</th>
                        <th>Product</th>
                        <th>Sales</th>
                    </tr>
                `;

                Object.values(aggregatedData).forEach(({ territory, product, qty }) => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td>${territory}</td>
                        <td>${product}</td>
                        <td>${qty}</td>
                    `;
                    output.appendChild(tr);
                });
            });
        } catch (err) {
            console.error(err);
            alert("Error reading file.");
        }
    });
});