const page=document.getElementById('profilePage'); document.getElementById('year').textContent=new Date().getFullYear();
function esc(v=''){return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function wa(phone){return `https://wa.me/${String(phone||'').replace(/\D/g,'')}`;}
async function load(){
 const id=new URLSearchParams(location.search).get('id');
 if(!id){page.innerHTML='<div class="empty">没有指定资料。</div>';return;}
 if(!window.supabaseClient){page.innerHTML='<div class="empty">请先配置 Supabase。</div>';return;}
 const {data:w,error}=await supabaseClient.from('women').select('*').eq('id',id).eq('is_published',true).single();
 if(error||!w){page.innerHTML='<div class="empty">资料不存在或暂未公开。</div>';return;}
 const photos=w.photos||[]; const hero=photos[0]||'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1000&q=80';
 page.innerHTML=`<div class="profile-layout"><div class="gallery"><img id="heroPhoto" class="hero-photo" src="${esc(hero)}" alt="${esc(w.name)}">${photos.length>1?`<div class="thumbs">${photos.map((p,i)=>`<button onclick="document.getElementById('heroPhoto').src='${esc(p)}'" aria-label="照片${i+1}"><img src="${esc(p)}" alt=""></button>`).join('')}</div>`:''}</div><article class="profile-info"><p class="eyebrow">PERSONAL PROFILE</p><h1>${esc(w.name)}</h1><div class="basic">${esc(w.age)} 岁 · ${esc(w.city||'—')} · ${esc(w.occupation||'—')}</div><div class="facts"><div><span>身高</span><strong>${esc(w.height_cm||'—')} cm</strong></div><div><span>婚姻状态</span><strong>${esc(w.marital_status||'—')}</strong></div></div><h3>关于她</h3><p class="bio">${esc(w.bio||w.short_intro||'')}</p>${w.hobbies?`<h3>兴趣爱好</h3><p class="bio">${esc(w.hobbies)}</p>`:''}<a class="whatsapp" href="${wa(w.whatsapp)}" target="_blank" rel="noopener">💬 WhatsApp 联系她</a></article></div>`;
} load();
