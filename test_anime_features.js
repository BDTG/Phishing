const { URL } = require('url');

function entropy(s) {
  if (!s || s.length === 0) return 0;
  const freq = {};
  for (const c of s) freq[c] = (freq[c] || 0) + 1;
  return Object.values(freq).reduce((h, f) => {
    const p = f / s.length;
    return h - p * Math.log2(p);
  }, 0);
}

function extractFeatures(urlStr) {
  let u;
  try { u = new URL(urlStr); } catch (e) { return null; }
  const hostname = u.hostname.replace(/^www\./, '');
  const bare = u.protocol + '//' + hostname;
  
  const path = u.pathname || '';
  const queryStr = u.search || '';
  const fragment = u.hash || '';

  console.log("=== PHÂN TÍCH ĐẶC TRƯNG TẠO RỦI RO ===");
  console.log("1. Độ dài toàn URL:", urlStr.length);
  console.log("2. Độ dài Path:", path.length);
  console.log("3. Số gạch ngang (-) toàn URL:", (urlStr.match(/-/g) || []).length);
  console.log("4. Số gạch ngang (-) trong Hostname:", (hostname.match(/-/g) || []).length);
  console.log("5. Số gạch ngang (-) trong Path:", (path.match(/-/g) || []).length);
  console.log("6. Số từ khóa nhạy cảm (login, update...):", ['login','verify','update','secure'].some(kw => urlStr.includes(kw)));
  console.log("7. Entropy toàn URL:", entropy(urlStr));
  console.log("8. Entropy Path:", entropy(path));
}

extractFeatures('https://animevietsub.bz/');
console.log("----------------------------");
extractFeatures('https://animevietsub.bz/phim/saikyou-no-ousama-nidome-no-jinsei-wa-nani-wo-suru-2nd-season-a5909/');
