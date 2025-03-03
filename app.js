document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('uploadForm');
    const pdfFileInput = document.getElementById('pdfFile');
    const pdfCanvas = document.getElementById('pdfCanvas');
    const signatureArea = document.getElementById('signatureArea');
    const signatureCanvas = document.getElementById('signatureCanvas');
    const saveSignatureButton = document.getElementById('saveSignature');

    let pdfDoc, pdfBytes, pdfPage;

    // Handle PDF upload
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const file = pdfFileInput.files[0];
        if (!file) {
            alert('Silakan unggah file PDF.');
            return;
        }

        try {
            pdfBytes = await file.arrayBuffer();
            pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);

            // Render halaman pertama PDF ke canvas
            await renderPDFPage();

            // Tampilkan area tanda tangan
            signatureArea.style.display = 'block';
            alert('PDF berhasil diunggah!');
        } catch (error) {
            console.error('Error loading PDF:', error);
            alert('Gagal memuat PDF. Pastikan file yang diunggah adalah PDF yang valid.');
        }
    });

    // Fungsi untuk menampilkan halaman pertama PDF
    async function renderPDFPage() {
        const pdfData = new Uint8Array(pdfBytes);
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        pdfPage = await pdf.getPage(1);

        const viewport = pdfPage.getViewport({ scale: 1.5 });
        const context = pdfCanvas.getContext('2d');
        pdfCanvas.width = viewport.width;
        pdfCanvas.height = viewport.height;

        await pdfPage.render({ canvasContext: context, viewport }).promise;

        // Atur ukuran signatureCanvas sesuai dengan pdfCanvas
        signatureCanvas.width = viewport.width;
        signatureCanvas.height = viewport.height;
        signatureCanvas.style.position = 'absolute';
        signatureCanvas.style.top = '0';
        signatureCanvas.style.left = '0';

        // Tampilkan area pratinjau PDF
        document.getElementById('pdfPreview').style.display = 'block';
    }

    // Handle signature drawing
    const ctx = signatureCanvas.getContext('2d');
    let isDrawing = false;

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

    // Simpan tanda tangan dan unduh PDF
    saveSignatureButton.addEventListener('click', async () => {
        if (!pdfDoc) return alert('Silakan unggah file PDF terlebih dahulu.');

        try {
            // Konversi signatureCanvas ke gambar
            const signatureDataUrl = signatureCanvas.toDataURL();

            // Embed signature into PDF
            const pngImage = await pdfDoc.embedPng(signatureDataUrl);
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];

            // Tambahkan tanda tangan ke halaman pertama PDF
            firstPage.drawImage(pngImage, {
                x: 50,
                y: 50,
                width: 100,
                height: 50,
            });

            // Simpan PDF yang sudah ditandatangani
            const signedPdfBytes = await pdfDoc.save();
            const blob = new Blob([signedPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            // Unduh PDF
            const a = document.createElement('a');
            a.href = url;
            a.download = 'signed-document.pdf';
            a.click();

            alert('PDF berhasil disimpan dan siap diunduh!');
        } catch (error) {
            console.error('Error embedding signature:', error);
            alert('Gagal menambahkan tanda tangan ke PDF.');
        }
    });
});
