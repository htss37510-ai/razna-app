const fs = require('fs');
const backupPath = 'c:/Users/A/Desktop/razan222/drug95_backup.json';
const dataPath = 'c:/Users/A/Desktop/razan222/public/data.json';

try {
    console.log('Reading backup...');
    const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    console.log('Reading data.json...');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    console.log('Finding drug 95...');
    const index = data.catalog.findIndex(d => d.id === '95');
    if (index !== -1) {
        console.log('Updating drug 95 fields...');
        data.catalog[index].nameAr = backup.nameAr;
        data.catalog[index].nameEn = backup.nameEn;
        data.catalog[index].image = backup.image;
        
        console.log('Writing back to data.json...');
        fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
        console.log('Successfully reverted drug 95 to: ' + backup.nameAr);
    } else {
        console.error('Error: Drug 95 not found in catalog');
        process.exit(1);
    }
} catch (err) {
    console.error('Error during revert:', err.message);
    process.exit(1);
}
