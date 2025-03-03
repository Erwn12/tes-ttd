document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const pdfFileInput = document.getElementById('pdfFile');
    const signatureArea = document.getElementById('signatureArea');
    const signatureCanvas = document.getElementById('signatureCanvas');
    const saveSignatureButton = document.getElementById('saveSignature');
    const downloadArea = document.getElementById('downloadArea');
    const downloadLink = document.getElementById('downloadLink');

    let pdfDoc, pdfBytes;

    // Handle PDF upload
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const file = pdfFileInput.files[0];
        if (!file) return alert('Silakan unggah file PDF.');

        // Read PDF file
        pdfBytes = await file.arrayBuffer();
        pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);

        // Show signature area
        signatureArea.style.display = 'block';
    });

    // Handle signature drawing
    const ctx = signatureCanvas.getContext('2d');
    let isDrawing = false;

    signatureCanvas.addEventListener('mousedown', () => (isDrawing = true));
    signatureCanvas.addEventListener('mouseup', () => (isDrawing = false));
    signatureCanvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;

        const rect = signatureCanvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    });

    signatureCanvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isDrawing = true;
    });

    signatureCanvas.addEventListener('touchmove', (e) => {
        if (!isDrawing) return;

        const touch = e.touches[0];
        const rect = signatureCanvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    });

    signatureCanvas.addEventListener('touchend', () => (isDrawing = false));

    // Save signature and embed into PDF
    saveSignatureButton.addEventListener('click', async () => {
        if (!pdfDoc) return alert('Silakan unggah file PDF terlebih dahulu.');

        // Convert canvas to image
        const signatureImage = await pdfDoc.embedPng(signatureCanvas.toDataURL());

        // Add signature to the first page of the PDF
        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        firstPage.drawImage(signatureImage, {
            x: 50,
            y: 50,
            width: 100,
            height: 50,
        });

        // Save the signed PDF
        const signedPdfBytes = await pdfDoc.save();
        const blob = new Blob([signedPdfBytes], { type: 'application/pdf' });
        downloadLink.href = URL.createObjectURL(blob);

        // Show download area
        downloadArea.style.display = 'block';
    });
});
