// 在这里填写 Supabase 项目信息。
// 只填写 Project URL + anon/publishable key；绝不要放 service_role/secret key。
window.SUPABASE_URL = 'YOUR_SUPABASE_URL';
window.SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY';

window.supabaseClient = null;
if (window.supabase && !window.SUPABASE_URL.startsWith('YOUR_') && !window.SUPABASE_ANON_KEY.startsWith('YOUR_')) {
  window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
}
