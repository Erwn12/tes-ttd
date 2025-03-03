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
    let isDragging = false;
    let startX, startY;

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

    // Add drag-and-drop functionality for the signature
    const signatureImageContainer = document.createElement('div');
    signatureImageContainer.style.position = 'absolute';
    signatureImageContainer.style.cursor = 'grab';
    document.body.appendChild(signatureImageContainer);

    saveSignatureButton.addEventListener('click', async () => {
        if (!pdfDoc) return alert('Silakan unggah file PDF terlebih dahulu.');

        // Convert canvas to image
        const signatureDataUrl = signatureCanvas.toDataURL();
        const img = new Image();
        img.src = signatureDataUrl;

        // Make the image draggable
        img.onload = () => {
            signatureImageContainer.innerHTML = '';
            signatureImageContainer.appendChild(img);

            let offsetX = 0, offsetY = 0;

            img.addEventListener('mousedown', (e) => {
                isDragging = true;
                offsetX = e.offsetX;
                offsetY = e.offsetY;
            });

            img.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
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
                img.style.left = `${touch.clientX - offsetX}px`;
                img.style.top = `${touch.clientY - offsetY}px`;
            });

            img.addEventListener('touchend', () => {
                isDragging = false;
            });
        };

        // Show download area
        downloadArea.style.display = 'block';
    });
});
