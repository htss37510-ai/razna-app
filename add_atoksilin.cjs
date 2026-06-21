const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, 'public/data.json');
const artifactImagePath = 'C:/Users/A/.gemini/antigravity/brain/c1d89eab-4390-4856-b18e-cb01b3c36f6f/media__1773500960633.jpg';

try {
    // 1. Read existing data
    console.log('Reading data.json...');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    // 2. Define the new drug
    const newDrug = {
        "id": "97", // Re-assigning IDs as needed, or keeping it as 97 as per user request context
        "nameEn": "",
        "nameAr": "Atoksilin",
        "ingredient": "Amoxicillin 500mg CAPSULES",
        "details": "Amoxicillin Trihydrate - ATABAY - TURKEY",
        "image": "" // Will be filled below
    };

    // 3. Get Base64 image
    if (fs.existsSync(artifactImagePath)) {
        console.log('Reading image and converting to Base64...');
        const imageBuffer = fs.readFileSync(artifactImagePath);
        newDrug.image = 'data:image/jpeg;base64,' + imageBuffer.toString('base64');
    } else {
        console.log('Artifact image NOT found at:', artifactImagePath);
    }

    if (newDrug.image) {
        // 4. Update the catalog
        console.log('Inserting Atoksilin at index 96 and truncating...');
        // Insert at index 96 (where "دواء جديد 97" was)
        data.catalog.splice(96, data.catalog.length - 96, newDrug);
        
        // 5. Save the updated data
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
        console.log('Success! data.json updated.');
    } else {
        console.log('Skipping update due to missing image.');
    }

} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}
