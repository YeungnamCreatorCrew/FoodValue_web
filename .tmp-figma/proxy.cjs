const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const hook = `
setTimeout(async()=>{
 await document.fonts.ready;
 document.querySelectorAll('.data-badge,.price-data-note,.home-sample-note,.home-section-heading>div>p').forEach(n=>n.style.visibility='hidden');
 const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
 while(n=walker.nextNode()) { if(n.parentElement.closest('script,style'))continue; n.textContent=n.textContent.replace(/ · Colab PoC/g,'').replace(/ · PoC 품목 우선/g,'').replace(/Colab PoC/g,'').replace(/DEMO · 예시/g,''); }
 document.querySelectorAll('nextjs-portal').forEach(n=>n.style.display='none');
 const script=document.createElement('script');script.src='https://mcp.figma.com/mcp/html-to-design/capture.js';document.head.appendChild(script);
},3000);
`;
http.createServer(async(req,res)=>{
 try {
 const target='http://localhost:3000'+req.url;
 const response=await fetch(target,{headers:{'accept-encoding':'identity'}});
 const headers={};response.headers.forEach((v,k)=>{if(!['content-encoding','content-length','transfer-encoding'].includes(k))headers[k]=v;});
 let bytes=Buffer.from(await response.arrayBuffer());
 if((headers['content-type']||'').includes('text/html'))bytes=Buffer.from(bytes.toString().replace('</body>','<script>'+hook+'</script></body>'));
 res.writeHead(response.status,headers);res.end(bytes);
 } catch(e){res.writeHead(502);res.end(String(e));}
}).listen(3005,'127.0.0.1',()=>console.log('Figma capture proxy http://127.0.0.1:3005'));
