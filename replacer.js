const fs = require('fs');
let c = fs.readFileSync('secret.html', 'utf8');
c = c.replace(/<img src="assets\/images\/scrapbook\/arnil\d+\.png"([^>]+)>/g, (match, p1) => `<img src=""${p1} class="opacity-0">`);
c = c.replace(/onerror="this\.src='[^']+'"/g, '');
fs.writeFileSync('secret.html', c);
