const fs = require('fs');
const file = 'public/data.json';
const d = JSON.parse(fs.readFileSync(file, 'utf8'));

const drug1 = d.drugs.find(x => x.nameEn === 'lron Sucrose 20 ml');
const drug2 = d.drugs.find(x => x.nameEn === 'Iron Sucrose 20 ml');

if (drug1) drug1.companyName = 'CLAND';
if (drug2) drug2.companyName = 'CLAND';

fs.writeFileSync(file, JSON.stringify(d, null, 2), 'utf8');
console.log('Done updating lron Sucrose 20 ml to CLAND');
