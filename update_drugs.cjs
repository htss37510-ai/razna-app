const fs = require('fs');
const file = 'public/data.json';
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

const groups = [
  {
    company: "ATABAY",
    drugs: [
      "Klavunat 1000 mg", "Klavunat 625 mg", "Klavunat 457 mg", "Klavunat 312.5 mg",
      "Cipronatin 500 mg", "Cipronatin 750 mg", "ENOX 2000 IU/ 0.2 ml", 
      "ENOX 4000 IU/ 0.2 ml", "ENOX 6000 IU/ 0.2 ml", "Parol 10 mg/ml",
      "Trimoks Fort 160 / 800 mg", "Pedifen 100 ml"
    ].map(d => d.replace(/\.$/, '').trim().toLowerCase())
  },
  {
    company: "AUROBINDO",
    drugs: [
      "Koact 1000 mg Tab", "Koact 625 mg Tab", "Koact 375 mg Tab", "Koact 312.5 susp",
      "Zmox 500 mg Cap", "Levokilz 500 mg Tab", "Auroxetil 500 mg", "Auropodox 200 mg",
      "Merogram 1000 mg", "Moxiwar 400 mg", "Aroxicam 15 mg", "Aroxicam 7.5 mg",
      "Celdol 200 mg", "ALZYL 500 mg", "Pegaset 75 mg", "Pegaset 150 mg",
      "DUTABIT PLUS 0.5/0.4 mg", "OD-TAM 0.4 mg", "Rofast 10 mg", "Rofast 20 mg",
      "Atorkey 20 mg", "Atorkey 40 mg", "Be study 8 mg", "Be study 16 mg",
      "M-Kast 4 mg", "M-Kast 5 mg", "M-Kast 10 mg", "Ciatuff 5 mg", "Ciatuff 10 mg",
      "Ciatuff 20 mg", "AURODANZ 8 mg", "ACLOHERP 400 mg", "ONCHOFIN 250 mg",
      "Onegaba 300 mg"
    ].map(d => d.replace(/\.$/, '').trim().toLowerCase())
  },
  {
    company: "GLAND",
    drugs: [
      "Biscolen amp", "Gentamicin 80 mg", "Chlorpheniramine amp", "Metocloprmide amp",
      "Furosemide amp", "Diclofenic 75 mg", "Oxytocine amp", "Iron Sucrose 20 ml",
      "Tranexamic 100 mg / 5 mL", "OMEPRAZOLE 40 mg / 10 mL", "ATROLEN amp"
    ].map(d => d.replace(/\.$/, '').trim().toLowerCase())
  },
  {
    company: "Aswar AL-khaleej",
    drugs: [
      "Doprasole Skin Oint", "Ginoden 0.3% Cream", "On-Fumet syr", "As-Medozal syr",
      "AsBonthan Cream", "AsBonthan Oint", "AS Paramol 125 mg", "AS Paramol 250 mg",
      "AS Myco - heal 400 mg", "Aswaconazole Cream", "Voltac supp 12.5 mg",
      "Aswar - xiga 10 mg", "Aswar Folic acid 5mg", "Desloratadine 5 mg",
      "Asponsten 500 mg", "Levofloxacine 500 mg", "Asadol Relieef tab",
      "Asadol Extra Relieef tab", "Asadol Night tab"
    ].map(d => d.replace(/\.$/, '').replace('–', '-').trim().toLowerCase())
  },
  {
    company: "Vem",
    drugs: [
      "Asirax vial", "Omeref vial", "Fericose amp", "Dopadren amp"
    ].map(d => d.replace(/\.$/, '').trim().toLowerCase())
  },
  {
    company: "Apotheker pharma",
    drugs: [
      "Cephaker 125 mg / 5 ml", "Apoxime 100 mg / 5 ml"
    ].map(d => d.replace(/\.$/, '').trim().toLowerCase())
  }
];

let updatedCount = 0;

data.drugs.forEach(d => {
  if (d.nameEn) {
    const name = d.nameEn.trim().toLowerCase().replace(/\s+/g, ' ');
    for (const group of groups) {
      if (group.drugs.some(g => name.includes(g) || g.includes(name))) {
        d.companyName = group.company;
        updatedCount++;
        break;
      }
    }
  }
});

console.log('Total drugs:', data.drugs.length);
console.log('Updated:', updatedCount);

fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
