import qrcode

# Data to be encoded in the QR code (the URL)
data = "https://tomchengzi.github.io/maogai/"

# Create a QR code instance
qr = qrcode.QRCode(
    version=1,  # QR code version (1 to 40, determines size and data capacity)
    error_correction=qrcode.constants.ERROR_CORRECT_L,  # Error correction level
    box_size=10,  # Size of each box (pixel) in the QR code
    border=4,  # Border size around the QR code
)

# Add data to the QR code
qr.add_data(data)
qr.make(fit=True)

# Create an image from the QR code instance
img = qr.make_image(fill_color="black", back_color="white")

# Save the image
img.save("maogai_qrcode.png")

print("QR code generated successfully and saved as maogai_qrcode.png")
