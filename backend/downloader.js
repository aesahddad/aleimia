const https = require('https');
const fs = require('fs');
const path = require('path');

const url = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/MaterialsVariantsShoe/glTF-Binary/MaterialsVariantsShoe.glb";
const dir = path.join(__dirname, 'uploads');
const filePath = path.join(dir, 'shoe.glb');

// Ensure Directory
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log("Created directory:", dir);
}

// Download
const file = fs.createWriteStream(filePath);
https.get(url, function (response) {
    if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', function () {
            file.close(() => {
                console.log("Download Completed: shoe.glb");
            });
        });
    } else {
        console.error("Download Failed. Status:", response.statusCode);
        fs.unlink(filePath, () => { }); // Delete partial
    }
}).on('error', function (err) {
    fs.unlink(filePath, () => { });
    console.error("Error:", err.message);
});
