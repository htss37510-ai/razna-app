const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'public/data.json');
const artifactImagePath = 'C:/Users/A/.gemini/antigravity-ide/brain/af83ed9c-6df9-4733-8d89-3e430cb9c6be/media__1780918865556.jpg';

try {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    let maxId = 0;
    if (data.drugs && data.drugs.length > 0) {
        maxId = Math.max(...data.drugs.map(d => parseInt(d.id) || 0));
    }
    
    const newId = (maxId + 1).toString();
    
    const newDrug = {
        "id": newId,
        "nameEn": "Levonat 500 mg",
        "nameAr": "ليفونات 500 مغ",
        "ingredient": "Levofloxacin",
        "details": "Broad Spectrum Antibacterial",
        "companyName": "ATABAY",
        "image": ""
    };

    if (fs.existsSync(artifactImagePath)) {
        const imageBuffer = fs.readFileSync(artifactImagePath);
        newDrug.image = 'data:image/jpeg;base64,' + imageBuffer.toString('base64');
    } else {
        console.log('Artifact image NOT found at:', artifactImagePath);
    }

    if (!data.drugs) {
        data.drugs = [];
    }
    
    data.drugs.push(newDrug);
    
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Success! data.json updated with Levonat 500 mg at id ${newId}. Total drugs: ${data.drugs.length}`);

} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}
