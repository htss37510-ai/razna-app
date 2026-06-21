const fs = require('fs');
const file = 'public/data.json';
const d = JSON.parse(fs.readFileSync(file, 'utf8'));

const drug = d.drugs.find(x => x.nameEn === 'Atoksilin');

if (drug) {
  drug.companyName = 'ATABAY';
  console.log('Done updating Atoksilin to ATABAY');
} else {
  console.log('Drug Atoksilin not found');
}

fs.writeFileSync(file, JSON.stringify(d, null, 2), 'utf8');
