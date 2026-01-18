export async function generateFingerprint(){
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.textBaseline = "top";
  ctx.font = "14px Arial";
  ctx.fillText("blackjack_fingerprint", 2, 2);
  const canvasHash = canvas.toDataURL();

  const raw = navigator.userAgent + screen.width + screen.height + canvasHash;
  return await sha256(raw);
}

export async function sha256(str){
  const buf = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('');
}

// DEVTOOLS DETECTION
setInterval(()=>{
  if(window.outerWidth - window.innerWidth > 200){
    document.body.innerHTML = "CHEAT RILEVATO";
    throw new Error("DEVTOOLS");
  }
},1000);
