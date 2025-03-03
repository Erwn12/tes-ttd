document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const pdfFileInput = document.getElementById('pdfFile');
    const signatureArea = document.getElementById('signatureArea');
    const signatureCanvas = document.getElementById('signatureCanvas');
    const saveSignatureButton = document.getElementById('saveSignature');
    const downloadArea = document.getElementById('downloadArea');
    const downloadLink = document.getElementById('downloadLink');

    let pdfDoc, pdfBytes;
    let isDrawing = false;

    // Handle PDF upload
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Hentikan refresh halaman

        const file = pdfFileInput.files[0];
        if (!file) {
            alert('Silakan unggah file PDF.');
            return;
        }

        try {
            // Read PDF file
            pdfBytes = await file.arrayBuffer();
            pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);

            // Show signature area
            signatureArea.style.display = 'block';
            alert('PDF berhasil diunggah!');
        } catch (error) {
            console.error('Error loading PDF:', error);
            alert('Gagal memuat PDF. Pastikan file yang diunggah adalah PDF yang valid.');
        }
    });

    // Handle signature drawing
    const ctx = signatureCanvas.getContext('2d');

    signatureCanvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        ctx.beginPath();
        ctx.moveTo(e.offsetX, e.offsetY);
    });

    signatureCanvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    });

    signatureCanvas.addEventListener('mouseup', () => {
        isDrawing = false;
        ctx.closePath();
    });

    signatureCanvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        isDrawing = true;
        const touch = e.touches[0];
        ctx.beginPath();
        ctx.moveTo(touch.clientX - signatureCanvas.offsetLeft, touch.clientY - signatureCanvas.offsetTop);
    });

    signatureCanvas.addEventListener('touchmove', (e) => {
        if (!isDrawing) return;
        const touch = e.touches[0];
        ctx.lineTo(touch.clientX - signatureCanvas.offsetLeft, touch.clientY - signatureCanvas.offsetTop);
        ctx.stroke();
    });

    signatureCanvas.addEventListener('touchend', () => {
        isDrawing = false;
        ctx.closePath();
    });

    // Save signature and embed into PDF
    saveSignatureButton.addEventListener('click', async () => {
        if (!pdfDoc) return alert('Silakan unggah file PDF terlebih dahulu.');

        try {
            // Convert canvas to image
            const signatureDataUrl = signatureCanvas.toDataURL();
            const img = new Image();
            img.src = signatureDataUrl;

            // Embed signature into PDF
            const pngImage = await pdfDoc.embedPng(signatureDataUrl);
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];

            // Add signature to the first page of the PDF
            firstPage.drawImage(pngImage, {
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
        } catch (error) {
            console.error('Error embedding signature:', error);
            alert('Gagal menambahkan tanda tangan ke PDF.');
        }
    });
});
