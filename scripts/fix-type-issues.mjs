import fs from 'fs';

// 1. Fix irrigation page.tsx
let irr = fs.readFileSync('src/app/(app)/irrigation/page.tsx', 'utf8');
irr = irr.replace(/type="user"/g, 'type="user_entered"');
fs.writeFileSync('src/app/(app)/irrigation/page.tsx', irr, 'utf8');
console.log('Fixed irrigation page.tsx');

// 2. Fix page.tsx
let page = fs.readFileSync('src/app/page.tsx', 'utf8');
if (!page.includes('Droplets,')) {
  page = page.replace('Droplet,', 'Droplet,\n  Droplets,');
}
fs.writeFileSync('src/app/page.tsx', page, 'utf8');
console.log('Fixed page.tsx');

