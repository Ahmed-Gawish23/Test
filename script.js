document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("fileInput").addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      let jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      console.log("Raw sheet data:", jsonData);

      let validRowIndex = jsonData.findIndex(row =>
        row.includes("Territory Name") ||
        row.includes("ZONE_NAME") ||
        row.includes("Item Name") ||
        row.includes("Product Name") ||
        row.includes("PRODUCT_NAME") ||
        row.includes("Sales") ||
        row.includes("QTY") ||
        row.includes("NET_QUANTITY")
      );

      if (validRowIndex === -1) {
        alert("No valid data found in the file");
        console.error("No valid data found");
        return;
      }

      jsonData = jsonData.slice(validRowIndex);
      const headers = jsonData.shift();
      console.log("Headers:", headers);

      const validData = jsonData.map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      });

      console.log("Valid Data:", validData);

      let columnMapping = {};
      const columnNames = Object.keys(validData[0]);

      // تحديد الأعمدة بناءً على الأسماء في الأعمدة
      if (columnNames.includes("Product Name") && columnNames.includes("Territory Name") && columnNames.includes("Sales")) {
        columnMapping = { item: "Product Name", territory: "Territory Name", qty: "Sales" };
      } else if (columnNames.includes("Item Name") && columnNames.includes("Territory Name") && columnNames.includes("QTY")) {
        columnMapping = { item: "Item Name", territory: "Territory Name", qty: "QTY" };
      } else if (columnNames.includes("PRODUCT_NAME") && columnNames.includes("ZONE_NAME") && columnNames.includes("NET_QUANTITY")) {
        columnMapping = { item: "PRODUCT_NAME", territory: "ZONE_NAME", qty: "NET_QUANTITY" };
      } else {
        alert("Unknown file format");
        console.error("Unknown file format");
        return;
      }

      const items = [...new Set(validData.map(row => row[columnMapping.item]).filter(Boolean))].sort();
      const territories = [...new Set(validData.map(row => row[columnMapping.territory]).filter(Boolean))].sort();

      const itemSelect = document.getElementById("itemSelect");
      const territorySelect = document.getElementById("territorySelect");

      // ملء الخيارات في القوائم المنسدلة
      itemSelect.innerHTML = "";
      territorySelect.innerHTML = "";

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

      document.getElementById("filterButton").addEventListener("click", () => {
        const selectedItems = Array.from(itemSelect.selectedOptions).map(option => option.value);
        const selectedTerritories = Array.from(territorySelect.selectedOptions).map(option => option.value);

        // تصفية البيانات حسب المناطق والمنتجات المحددة
        const filteredData = validData.filter(row =>
          selectedItems.includes(row[columnMapping.item]) &&
          selectedTerritories.includes(row[columnMapping.territory])
        );

        const result = {};
        filteredData.forEach(row => {
          const key = `${row[columnMapping.item]} - ${row[columnMapping.territory]}`;
          if (!result[key]) result[key] = 0;
          result[key] += row[columnMapping.qty];
        });

        const output = document.getElementById("output");
        output.innerHTML = "<h3>Filtered Results:</h3>";
        Object.entries(result).forEach(([key, qty]) => {
          const p = document.createElement("p");
          p.textContent = `${key}: ${qty} boxes`;
          output.appendChild(p);
        });
      });
    } catch (error) {
      alert("An error occurred while processing the file.");
      console.error("Error processing file:", error);
    }
  });
});