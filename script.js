let data = [];
let headers = [];

document.getElementById('fileInput').addEventListener('change', handleFileUpload);

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const workbook = XLSX.read(e.target.result, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            // فصل العناوين عن البيانات
            headers = data[0];
            data = data.slice(1);

            populateTable(data);
            populateFilterColumns();
        };
        reader.readAsBinaryString(file);
    }
}

function populateTable(data) {
    const tableHeader = document.getElementById('tableHeader');
    const tableBody = document.getElementById('tableBody');

    tableHeader.innerHTML = '';
    tableBody.innerHTML = '';

    // إنشاء العناوين
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        tableHeader.appendChild(th);
    });

    // إنشاء الصفوف
    data.forEach(row => {
        const tr = document.createElement('tr');
        headers.forEach((_, index) => {
            const td = document.createElement('td');
            td.textContent = row[index] || '';
            tr.appendChild(td);
        });
        tableBody.appendChild(tr);
    });
}

function populateFilterColumns() {
    const filterColumn = document.getElementById('filterColumn');
    filterColumn.innerHTML = '<option value="">اختر</option>';
    headers.forEach((header, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = header;
        filterColumn.appendChild(option);
    });
}

function updateFilterValues() {
    const filterColumn = document.getElementById('filterColumn').value;
    const filterValue = document.getElementById('filterValue');
    filterValue.innerHTML = '<option value="">الكل</option>';

    if (filterColumn !== '') {
        const columnIndex = parseInt(filterColumn);
        const uniqueValues = [...new Set(data.map(row => row[columnIndex]))];

        uniqueValues.forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            filterValue.appendChild(option);
        });
    }
}

function applyFilter() {
    const filterColumn = document.getElementById('filterColumn').value;
    const filterValue = document.getElementById('filterValue').value;

    if (filterColumn !== '') {
        const columnIndex = parseInt(filterColumn);
        const filteredData = filterValue === ''
            ? data
            : data.filter(row => row[columnIndex] === filterValue);

        populateTable(filteredData);
    }
}