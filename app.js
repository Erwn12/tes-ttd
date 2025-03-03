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
        if (!file) {
            alert('Silakan unggah file PDF.');
            return;
        }

        try {
            pdfBytes = await file.arrayBuffer();
            pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);

            // Tampilkan halaman pertama PDF
            await displayPDF(pdfBytes);

            // Tampilkan area tanda tangan
            signatureArea.style.display = 'block';
            alert('PDF berhasil diunggah!');
        } catch (error) {
            console.error('Error loading PDF:', error);
            alert('Gagal memuat PDF. Pastikan file yang diunggah adalah PDF yang valid.');
        }
    });

    // Fungsi untuk menampilkan halaman pertama PDF
    async function displayPDF(pdfBytes) {
        const pdfData = new Uint8Array(pdfBytes);
        const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
        const page = await pdf.getPage(1);

        const scale = 1.5;
        const viewport = page.getViewport({ scale });

        const canvas = document.getElementById('pdfCanvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;

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

    // Fungsi untuk membuat tanda tangan dapat dipindahkan
    function makeDraggable(img) {
        let isDragging = false;
        let offsetX, offsetY;

        img.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.offsetX;
            offsetY = e.offsetY;
        });

        img.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            img.style.position = 'absolute';
            img.style.left = `${e.pageX - offsetX}px`;
            img.style.top = `${e.pageY - offsetY}px`;
        });

        img.addEventListener('mouseup', () => {
            isDragging = false;
        });

        img.addEventListener('touchstart', (e) => {
            isDragging = true;
            const touch = e.touches[0];
            offsetX = touch.clientX - img.offsetLeft;
            offsetY = touch.clientY - img.offsetTop;
        });

        img.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const touch = e.touches[0];
            img.style.position = 'absolute';
            img.style.left = `${touch.clientX - offsetX}px`;
            img.style.top = `${touch.clientY - offsetY}px`;
        });

        img.addEventListener('touchend', () => {
            isDragging = false;
        });
    }

    // Simpan tanda tangan sebagai gambar dan buat draggable
    saveSignatureButton.addEventListener('click', async () => {
        if (!pdfDoc) return alert('Silakan unggah file PDF terlebih dahulu.');

        try {
            // Konversi canvas ke gambar
            const signatureDataUrl = signatureCanvas.toDataURL();
            const img = new Image();
            img.src = signatureDataUrl;
            img.style.position = 'absolute';
            img.style.width = '100px';
            img.style.cursor = 'grab';

            // Tambahkan gambar ke container
            const container = document.getElementById('signatureImageContainer');
            container.innerHTML = '';
            container.appendChild(img);

            // Buat tanda tangan dapat dipindahkan
            makeDraggable(img);

            // Tampilkan area drag-and-drop
            document.getElementById('signatureDropArea').style.display = 'block';

            // Embed signature into PDF
            const pngImage = await pdfDoc.embedPng(signatureDataUrl);
            const pages = pdfDoc.getPages();
            const firstPage = pages[0];

            // Ambil posisi tanda tangan
            const rect = img.getBoundingClientRect();
            const x = rect.left - container.getBoundingClientRect().left;
            const y = rect.top - container.getBoundingClientRect().top;

            // Tambahkan tanda tangan ke halaman pertama PDF
            firstPage.drawImage(pngImage, {
                x: x,
                y: firstPage.getHeight() - y - 50, // Sesuaikan posisi Y
                width: 100,
                height: 50,
            });

            // Simpan PDF yang sudah ditandatangani
            const signedPdfBytes = await pdfDoc.save();
            const blob = new Blob([signedPdfBytes], { type: 'application/pdf' });
            downloadLink.href = URL.createObjectURL(blob);

            // Tampilkan area unduh
            downloadArea.style.display = 'block';
        } catch (error) {
            console.error('Error embedding signature:', error);
            alert('Gagal menambahkan tanda tangan ke PDF.');
        }
    });
});
