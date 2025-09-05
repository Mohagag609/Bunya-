document.addEventListener('DOMContentLoaded', () => {
    const exportBtn = document.getElementById('export-btn');
    const statusEl = document.getElementById('status');

    if (!exportBtn) {
        console.error('Export button not found!');
        statusEl.textContent = 'خطأ: لم يتم العثور على زر التصدير.';
        return;
    }

    exportBtn.addEventListener('click', async () => {
        exportBtn.disabled = true;
        statusEl.textContent = 'جاري التصدير... يرجى الانتظار.';
        statusEl.style.color = '#007bff';

        try {
            // The openDB function is in db.js and returns a promise that resolves with the db instance.
            // We need to make sure the database is open before proceeding.
            await openDB();

            const exportData = {};

            // OBJECT_STORES is a global constant defined in db.js
            if (typeof OBJECT_STORES === 'undefined' || !Array.isArray(OBJECT_STORES)) {
                throw new Error('لم يتم العثور على قائمة مخازن الكائنات (OBJECT_STORES). تأكد من تحميل ملف db.js بشكل صحيح.');
            }

            console.log(`Starting export for ${OBJECT_STORES.length} object stores...`);

            // Use Promise.all to fetch data from all stores concurrently
            const promises = OBJECT_STORES.map(async (storeName) => {
                // The getAll function is defined in db.js
                const data = await getAll(storeName);
                exportData[storeName] = data;
                console.log(`Successfully exported ${data.length} records from "${storeName}".`);
            });

            await Promise.all(promises);

            // Create a JSON string, then a Blob, then a download link
            const jsonData = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = 'database-export.json';
            document.body.appendChild(a);
            a.click(); // Trigger the download

            // Clean up the temporary URL and link
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            statusEl.textContent = 'اكتمل التصدير بنجاح! تم تنزيل الملف.';
            statusEl.style.color = 'green';

        } catch (error) {
            console.error('Export failed:', error);
            statusEl.textContent = `فشل التصدير: ${error.message}`;
            statusEl.style.color = 'red';
        } finally {
            exportBtn.disabled = false;
        }
    });
});
