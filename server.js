const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || 3000);
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, 'data.json');
const PUBLIC = path.join(__dirname, 'public');
const sessions = new Map();

function hash(password, salt = crypto.randomBytes(16).toString('hex')) {
  return { salt, value: crypto.scryptSync(password, salt, 64).toString('hex') };
}
function matches(password, stored) {
  return crypto.timingSafeEqual(Buffer.from(hash(password, stored.salt).value, 'hex'), Buffer.from(stored.value, 'hex'));
}
function now() { return new Date().toISOString(); }
function seed() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error('Defina ADMIN_PASSWORD antes de iniciar a aplicação.');
  return {
    users: [{ id: 'admin', name: 'Administrador', sector: 'Administrador', username: 'admin', password: hash(password), forcePasswordChange: false, active: true }],
    pallets: [], partials: [], receipts: [], resetRequests: [], settings: { discordWebhook: '', discordHour: '18:00', discordDays: [1,2,3,4,5], lastDiscordDigest: '' }
  };
}
function readData() { if (!fs.existsSync(DATA_FILE)) { const data = seed(); writeData(data); return data; } return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
function writeData(data) { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); }
function publicUser(u) { return { id: u.id, name: u.name, sector: u.sector, username: u.username, active: u.active, forcePasswordChange: u.forcePasswordChange }; }
function tokenUser(req, data) { const token = (req.headers.authorization || '').replace('Bearer ', ''); const session = sessions.get(token); if (!session) return null; return data.users.find(u => u.id === session.userId && u.active) || null; }
function send(res, status, body) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)); }
function body(req) { return new Promise((resolve, reject) => { let raw = ''; req.on('data', d => raw += d); req.on('end', () => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('JSON inválido')); } }); }); }
function can(user, sectors) { return user && sectors.includes(user.sector); }
function pending(data) { return data.pallets.filter(p => p.status === 'PRONTO'); }
function summary(data) { const items = pending(data), partials=(data.partials||[]).filter(p=>p.status==='PENDENTE'), products = {}; items.forEach(p => products[p.product] = (products[p.product] || 0) + Number(p.quantity)); partials.forEach(p=>products[p.product]=(products[p.product]||0)+Number(p.quantity)); return { pallets: items.length, partials:partials.length, products: Object.entries(products).sort(([a],[b]) => a.localeCompare(b, 'pt-BR')).map(([product, quantity]) => ({ product, quantity })) }; }
function digestText(data) { const s = summary(data); const lines = [`**Paletes aguardando transferência — ${new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Recife' }).format(new Date())}**`, `**Total: ${s.pallets} palete${s.pallets === 1 ? '' : 's'}**`]; s.products.forEach(x => lines.push(`- ${x.product}: ${Number(x.quantity).toLocaleString('pt-BR')} unidades`)); return lines.join('\n'); }
async function sendDiscord(data) { if (!data.settings.discordWebhook) return; const result = await fetch(data.settings.discordWebhook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: digestText(data) }) }); if (!result.ok) throw new Error('Webhook recusado pelo Discord'); }
function parseCode(code) {
  const value = String(code || '').trim();
  if (value.startsWith('{')) { const x = JSON.parse(value); return { id: x.id, product: x.product, op: String(x.op), quantity: Number(x.quantity) }; }
  const parts = value.split('|');
  if (parts.length === 4) return { id: parts[0], product: parts[1], op: parts[2], quantity: Number(parts[3]) };
  throw new Error('QR inválido. Use IDENTIFICADOR|PRODUTO|OP|QUANTIDADE.');
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === 'GET' && !url.pathname.startsWith('/api/')) {
    const file = ['/', '/producao', '/logistica', '/admin'].includes(url.pathname) ? 'index.html' : url.pathname.slice(1);
    const target = path.resolve(PUBLIC, file);
    if (!target.startsWith(PUBLIC) || !fs.existsSync(target)) { res.writeHead(404); return res.end('Não encontrado'); }
    const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };
    res.writeHead(200, { 'Content-Type': types[path.extname(target)] || 'application/octet-stream' }); return fs.createReadStream(target).pipe(res);
  }
  const data = readData();
  try {
    if (req.method === 'POST' && url.pathname === '/api/login') {
      const b = await body(req); const user = data.users.find(u => u.username.toLowerCase() === String(b.username || '').toLowerCase() && u.active);
      if (!user || !matches(b.password || '', user.password)) return send(res, 401, { error: 'Usuário ou senha inválidos.' });
      const token = crypto.randomBytes(24).toString('hex'); sessions.set(token, { userId: user.id }); return send(res, 200, { token, user: publicUser(user) });
    }
    if (req.method === 'POST' && url.pathname === '/api/reset-request') { const b = await body(req); const u = data.users.find(x => x.username.toLowerCase() === String(b.username || '').toLowerCase()); if (u) { data.resetRequests = data.resetRequests.filter(x => x.userId !== u.id); data.resetRequests.push({ id: crypto.randomUUID(), userId: u.id, requestedAt: now() }); writeData(data); } return send(res, 200, { ok: true }); }
    if (req.method === 'GET' && url.pathname === '/api/public/bootstrap') return send(res, 200, { pallets: data.pallets, partials:data.partials||[], receipts: data.receipts, summary: summary(data) });
    if (req.method === 'POST' && url.pathname === '/api/public/register') {
      const b = await body(req); const p = parseCode(b.code); if (!p.id || !p.product || !p.op || !Number.isFinite(p.quantity) || p.quantity <= 0) throw new Error('Dados incompletos no QR.');
      if (data.pallets.some(x => x.id === p.id)) return send(res, 409, { error: 'Palete já registrado.', pallet: data.pallets.find(x => x.id === p.id) });
      const pallet = { ...p, initialQuantity:p.quantity, status: 'PRONTO', readyAt: now(), readyBy: 'Produção' }; data.pallets.unshift(pallet); writeData(data); return send(res, 201, { pallet });
    }
    if(req.method==='POST'&&url.pathname==='/api/public/partials'){const b=await body(req),p=data.pallets.find(x=>x.id===b.id&&x.status==='PRONTO'),q=Number(b.quantity);if(!p||!Number.isFinite(q)||q<=0||q>Number(p.quantity))throw new Error('Quantidade inválida para retirada parcial.');p.quantity-=q;if(p.quantity===0)p.status='ESGOTADO';const item={id:'AV-'+crypto.randomUUID().slice(0,8).toUpperCase(),sourcePalletId:p.id,product:p.product,op:p.op,quantity:q,reason:'Adiantamento',createdAt:now(),status:'PENDENTE'};data.partials.unshift(item);writeData(data);return send(res,201,{partial:item,pallet:p});}
    if (req.method === 'POST' && url.pathname === '/api/public/cancel') { const b = await body(req); const p = data.pallets.find(x => x.id === b.id && x.status === 'PRONTO'); if (!p) return send(res, 404, { error: 'Palete pendente não encontrado.' }); if (!String(b.reason || '').trim()) throw new Error('Informe o motivo do cancelamento.'); p.status='CANCELADO';p.cancelledAt=now();p.cancelledBy='Produção';p.cancelReason=String(b.reason).trim();writeData(data);return send(res,200,{pallet:p}); }
    if (req.method === 'POST' && url.pathname === '/api/public/receipts') { const b=await body(req);const ids=[...new Set(b.ids||[])],partialIds=[...new Set(b.partialIds||[])];if((!ids.length&&!partialIds.length)||!b.signature)throw new Error('Inclua itens e assinatura.');const pallets=ids.map(id=>data.pallets.find(p=>p.id===id)),partials=partialIds.map(id=>(data.partials||[]).find(p=>p.id===id));if(pallets.some(p=>!p||p.status!=='PRONTO')||partials.some(p=>!p||p.status!=='PENDENTE'))throw new Error('Há item inexistente ou já recebido.');const receipt={id:crypto.randomUUID(),palletIds:ids,partialIds,receivedAt:now(),receivedBy:'Assinatura digital',signature:b.signature};pallets.forEach(p=>{p.status='RECEBIDO';p.receiptId=receipt.id});partials.forEach(p=>{p.status='RECEBIDO';p.receiptId=receipt.id});data.receipts.unshift(receipt);writeData(data);return send(res,201,{receipt}); }
    const user = tokenUser(req, data); if (!user) return send(res, 401, { error: 'Sessão expirada. Entre novamente.' });
    if (req.method === 'GET' && url.pathname === '/api/bootstrap') return send(res, 200, { user: publicUser(user), pallets: data.pallets, partials:data.partials||[], receipts: data.receipts, summary: summary(data), settings: can(user, ['Administrador']) ? data.settings : undefined, users: can(user, ['Administrador']) ? data.users.map(publicUser) : undefined, resetRequests: can(user, ['Administrador']) ? data.resetRequests : undefined });
    if (req.method === 'POST' && url.pathname === '/api/pallets/register') {
      if (!can(user, ['Produção', 'Administrador'])) return send(res, 403, { error: 'Sem permissão.' }); const b = await body(req); const p = parseCode(b.code);
      if (!p.id || !p.product || !p.op || !Number.isFinite(p.quantity) || p.quantity <= 0) throw new Error('Dados incompletos no QR.');
      if (data.pallets.some(x => x.id === p.id)) return send(res, 409, { error: 'Palete já registrado.', pallet: data.pallets.find(x => x.id === p.id) });
      const pallet = { ...p, status: 'PRONTO', readyAt: now(), readyBy: user.name }; data.pallets.unshift(pallet); writeData(data); return send(res, 201, { pallet });
    }
    if (req.method === 'POST' && url.pathname === '/api/pallets/cancel') {
      if (!can(user, ['Produção', 'Administrador'])) return send(res, 403, { error: 'Sem permissão.' }); const b = await body(req); const p = data.pallets.find(x => x.id === b.id && x.status === 'PRONTO'); if (!p) return send(res, 404, { error: 'Palete pendente não encontrado.' }); if (!String(b.reason || '').trim()) throw new Error('Informe o motivo do cancelamento.'); p.status = 'CANCELADO'; p.cancelledAt = now(); p.cancelledBy = user.name; p.cancelReason = String(b.reason).trim(); writeData(data); return send(res, 200, { pallet: p });
    }
    if (req.method === 'POST' && url.pathname === '/api/receipts') {
      if (!can(user, ['Logística', 'Administrador'])) return send(res, 403, { error: 'Sem permissão.' }); const b = await body(req); const ids = [...new Set(b.ids || [])]; if (!ids.length || !b.signature) throw new Error('Inclua ao menos um palete e a assinatura.'); const pallets = ids.map(id => data.pallets.find(p => p.id === id)); if (pallets.some(p => !p || p.status !== 'PRONTO')) throw new Error('Há palete inexistente ou que não está pendente.'); const receipt = { id: crypto.randomUUID(), palletIds: ids, receivedAt: now(), receivedBy: user.name, signature: b.signature }; pallets.forEach(p => { p.status = 'RECEBIDO'; p.receiptId = receipt.id; }); data.receipts.unshift(receipt); writeData(data); return send(res, 201, { receipt });
    }
    if (req.method === 'POST' && url.pathname === '/api/password') { const b = await body(req); if (!b.password || b.password.length < 10) throw new Error('A senha deve ter ao menos 10 caracteres.'); user.password = hash(b.password); user.forcePasswordChange = false; writeData(data); return send(res, 200, { ok: true }); }
    if (req.method === 'POST' && url.pathname === '/api/admin/users') { if (!can(user, ['Administrador'])) return send(res, 403, { error: 'Sem permissão.' }); const b = await body(req); if (!b.name || !b.username || !b.password || !['Produção','Logística','Administrador'].includes(b.sector)) throw new Error('Preencha nome, usuário, setor e senha.'); if (data.users.some(x => x.username.toLowerCase() === b.username.toLowerCase())) throw new Error('Este usuário já existe.'); data.users.push({ id: crypto.randomUUID(), name: b.name, sector: b.sector, username: b.username, password: hash(b.password), forcePasswordChange: true, active: true }); writeData(data); return send(res, 201, { ok: true }); }
    if (req.method === 'POST' && url.pathname === '/api/admin/reset') { if (!can(user, ['Administrador'])) return send(res, 403, { error: 'Sem permissão.' }); const b = await body(req); const target = data.users.find(x => x.id === b.userId); if (!target || !b.password || b.password.length < 10) throw new Error('Informe uma senha temporária de ao menos 10 caracteres.'); target.password = hash(b.password); target.forcePasswordChange = true; data.resetRequests = data.resetRequests.filter(x => x.userId !== target.id); writeData(data); return send(res, 200, { ok: true }); }
    if (req.method === 'POST' && url.pathname === '/api/admin/settings') { if (!can(user, ['Administrador'])) return send(res, 403, { error: 'Sem permissão.' }); const b = await body(req); if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(b.discordHour||''))) throw new Error('Informe o horário no formato 24h (HH:MM).'); data.settings.discordWebhook = String(b.discordWebhook || '').trim(); data.settings.discordHour = b.discordHour; data.settings.discordDays = (b.discordDays||[]).map(Number).filter(x=>Number.isInteger(x)&&x>=0&&x<=6); writeData(data); return send(res, 200, { ok: true }); }
    if (req.method === 'POST' && url.pathname === '/api/admin/test-discord') { if (!can(user, ['Administrador'])) return send(res, 403, { error: 'Sem permissão.' }); await sendDiscord(data); return send(res, 200, { ok: true }); }
    return send(res, 404, { error: 'Rota não encontrada.' });
  } catch (error) { return send(res, 400, { error: error.message || 'Não foi possível concluir a operação.' }); }
});

setInterval(async () => {
  const data = readData(); const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Recife', weekday: 'short', hour: '2-digit', minute: '2-digit', year: 'numeric', month: '2-digit', day: '2-digit', hour12: false }).formatToParts(new Date()); const get = type => parts.find(p => p.type === type)?.value; const day = `${get('year')}-${get('month')}-${get('day')}`, index={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6}[get('weekday')];
  if ((data.settings.discordDays||[]).includes(index) && `${get('hour')}:${get('minute')}` === data.settings.discordHour && data.settings.lastDiscordDigest !== day) { try { await sendDiscord(data); data.settings.lastDiscordDigest = day; writeData(data); } catch (e) { console.error('Discord:', e.message); } }
}, 30000);
server.listen(PORT, () => console.log(`Controle de paletes em http://localhost:${PORT}`));
