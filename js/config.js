// 在这里填写 Supabase 项目信息。
// 只填写 Project URL + anon/publishable key；绝不要放 service_role/secret key。
window.SUPABASE_URL = 'https://yutraouosffjteivvlfx.supabase.co/rest/v1/';
window.SUPABASE_ANON_KEY = 'sb_publishable_9kM95KpOX6WPwcXowvPbWQ_s0_YJUEA';

window.supabaseClient = null;
if (window.supabase && !window.SUPABASE_URL.startsWith('YOUR_') && !window.SUPABASE_ANON_KEY.startsWith('YOUR_')) {
  window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
}
