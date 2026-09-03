const grid = document.getElementById('womenGrid');
const count = document.getElementById('count');
const cityFilter = document.getElementById('cityFilter');
const ageFilter = document.getElementById('ageFilter');
document.getElementById('year').textContent = new Date().getFullYear();
let women = [];

function escapeHtml(value='') { return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function photoOf(w) { return (w.photos && w.photos[0]) || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80'; }
function ageMatch(age, range) { if (!range) return true; age = Number(age); if (range==='46+') return age>=46; const [a,b]=range.split('-').map(Number); return age>=a && age<=b; }
function render() {
  const city=cityFilter.value, range=ageFilter.value;
  const list=women.filter(w => (!city || w.city===city) && ageMatch(w.age, range));
  count.textContent=`${list.length} 位`;
  if (!list.length) { grid.innerHTML='<div class="empty">暂时没有符合条件的资料。</div>'; return; }
  grid.innerHTML=list.map(w=>`<a class="woman-card" href="profile.html?id=${encodeURIComponent(w.id)}">
    <div class="photo-wrap"><img src="${escapeHtml(photoOf(w))}" alt="${escapeHtml(w.name)}" loading="lazy"><span class="status">${escapeHtml(w.city || '') }</span></div>
    <div class="card-body"><h2>${escapeHtml(w.name)}</h2><p>${escapeHtml(w.age)} 岁 · ${escapeHtml(w.occupation || '—')}</p><p class="muted">${escapeHtml(w.short_intro || '期待认识合适的人')}</p></div>
  </a>`).join('');
}
async function load() {
  if (!window.supabaseClient) { grid.innerHTML='<div class="empty">请先在 <code>js/config.js</code> 配置 Supabase。</div>'; count.textContent='—'; return; }
  const {data,error}=await supabaseClient.from('women').select('*').eq('is_published',true).order('sort_order',{ascending:true}).order('created_at',{ascending:false});
  if(error){ console.error(error); grid.innerHTML='<div class="empty">资料加载失败，请检查 Supabase 配置和 RLS。</div>'; return; }
  women=data||[];
  [...new Set(women.map(w=>w.city).filter(Boolean))].sort().forEach(city=>{ const o=document.createElement('option'); o.value=city; o.textContent=city; cityFilter.appendChild(o); });
  render();
}
cityFilter.addEventListener('change',render); ageFilter.addEventListener('change',render); load();
