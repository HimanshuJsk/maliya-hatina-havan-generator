window.addEventListener("load", () => {
    const loader = document.getElementById("preloader");

    setTimeout(() => {
        loader.style.opacity = "0";
        loader.style.transition = "opacity 0.5s ease";

        setTimeout(() => {
            loader.style.display = "none";
            document.body.style.overflow = "auto";
        }, 500);

    }, 2000);
});

const backToTop = document.getElementById("backToTop");

window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
        backToTop.style.display = "block";
    } else {
        backToTop.style.display = "none";
    }
});

backToTop.addEventListener("click", () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});

const phoneInput = document.querySelector("#userMobile");
const iti = window.intlTelInput(phoneInput, {
    initialCountry: "in", // Default to India
    separateDialCode: true,
    preferredCountries: ["in", "us", "gb",],
    utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.13/js/utils.js",
});

let cropper;
let croppedImageBase64 = null;
const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');

// 1. Upload Logic
document.getElementById('dropZone').onclick = () => document.getElementById('fileInput').click();
document.getElementById('fileInput').onchange = function (e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            const img = document.getElementById('imageToCrop');
            img.src = event.target.result;
            const modal = new bootstrap.Modal(document.getElementById('cropperModal'));
            modal.show();
            if (cropper) cropper.destroy();
            cropper = new Cropper(img, { aspectRatio: 1, viewMode: 1 });
        };
        reader.readAsDataURL(file);
    }
};

// 2. Crop Logic
document.getElementById('cropSaveBtn').onclick = () => {
    croppedImageBase64 = cropper.getCroppedCanvas({ width: 600, height: 600 }).toDataURL();
    bootstrap.Modal.getInstance(document.getElementById('cropperModal')).hide();
};

// 3. Generation Logic (Precise Coordinates for your Template)
document.getElementById('generateBtn').onclick = async () => {
    const name = document.getElementById('userName').value;
    const city = document.getElementById('userCity').value;
    const rawNumber = phoneInput.value;

    // Check if phone number is valid for the selected country
    if (!name || !city || !rawNumber || !croppedImageBase64) {
        return alert("કૃપા કરીને નામ, શહેર, માન્ય મોબાઇલ નંબર ભરો અને ફોટો અપલોડ કરો.");
    }

    if (!iti.isValidNumber()) {
        return alert("કૃપા કરીને પસંદ કરેલા દેશ માટે માન્ય મોબાઇલ નંબર દાખલ કરો.");
    }

    const fullPhoneNumber = iti.getNumber();
    console.log("Generating for:", name, fullPhoneNumber);

    const template = new Image();
    template.src = 'assets/maliya-hatina-image.png'; // Ensure folder is named 'assets'

    template.onload = () => {
        canvas.width = template.width;
        canvas.height = template.height;
        ctx.drawImage(template, 0, 0);

        const userImg = new Image();
        userImg.src = croppedImageBase64;
        userImg.onload = async () => {

            const photoX = 155;
            const photoY = 825;
            const size = 395;

            ctx.save();
            ctx.beginPath();
            ctx.arc(photoX + size / 2, photoY + size / 2, size / 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(userImg, photoX, photoY, size, size);
            ctx.restore();

            ctx.fillStyle = "#002e5b";
            ctx.font = "bold 35px Arial";
            ctx.textAlign = "center";
            ctx.fillText(name, 1080, 1040);

            const finalImageBase64 = canvas.toDataURL('image/jpeg', 0.8);

            try {
                const response = await fetch('/api/save-banner', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: name,
                        city: city, // Include City in the payload
                        mobile: fullPhoneNumber,
                        imageBase64: finalImageBase64
                    })
                });

                if (response.ok) {
                    console.log("Database updated successfully");
                }
            } catch (err) {
                console.error("Database sync failed:", err);
            }

            // Show results
            document.getElementById('resultArea').classList.remove('d-none');
            document.getElementById('generateBtn').classList.add('d-none');
            document.getElementById('downloadBox').classList.remove('d-none');
        };
    };
};

// 4. Download
document.getElementById('downloadBtn').onclick = () => {
    const link = document.createElement('a');
    link.download = 'Maliya-Hatina-Havan.jpg';
    link.href = canvas.toDataURL('image/jpeg', 1.0);
    link.click();
};