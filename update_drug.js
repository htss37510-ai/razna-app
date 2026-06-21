
import fs from 'fs';

const filePath = 'c:\\Users\\A\\Desktop\\razan222\\public\\data.json';
const base64Path = 'c:\\Users\\A\\Desktop\\razan222\\base64_image.txt';

try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const newImageBase64 = fs.readFileSync(base64Path, 'utf8').trim();
    
    let found = false;
    if (data.catalog && Array.isArray(data.catalog)) {
        for (let drug of data.catalog) {
            if (drug.id === "95") {
                drug.nameAr = "Atoksilin";
                drug.image = "data:image/jpeg;base64," + newImageBase64;
                found = true;
                break;
            }
        }
    }
    
    if (found) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log('Successfully updated drug 95');
    } else {
        console.error('Drug 95 not found in data.json catalog');
        process.exit(1);
    }
} catch (err) {
    console.error('Error:', err);
    process.exit(1);
}
