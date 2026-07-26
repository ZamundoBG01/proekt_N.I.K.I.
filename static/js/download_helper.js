// Помощна функция за сигурно сваляне на файлове (Word/PDF) чрез POST заявка (без лимит на дължината)
async function downloadTextFilePost(text, ws, format) {
    try {
        const response = await fetch('/download_text_file_post', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: text, ws: ws, format: format })
        });

        if (!response.ok) {
            throw new Error('Грешка при генериране на файла от сървъра.');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = format === 'pdf' ? 'document.pdf' : 'document.docx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Грешка при сваляне:", e);
        alert("Възникна грешка при свалянето на файла.");
    }
}
