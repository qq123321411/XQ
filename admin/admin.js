const sb = window.supabaseClient;

const $ = id => document.getElementById(id);

let currentPhotos = [];


/* ==================================================
   基础提示
================================================== */

function msg(t){
  const el = $('loginMsg');
  if(el) el.textContent = t;
}

function fmsg(t){
  const el = $('formMsg');
  if(el) el.textContent = t;
}


/* ==================================================
   HTML 转义
================================================== */

function esc(v = ''){
  return String(v).replace(
    /[&<>'"]/g,
    c => ({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      "'":'&#39;',
      '"':'&quot;'
    }[c])
  );
}


/* ==================================================
   启动
================================================== */

async function boot(){

  if(!sb){
    msg('请先配置 ../js/config.js');
    return;
  }

  const {
    data:{
      session
    }
  } = await sb.auth.getSession();

  if(session){
    showApp();
  }
}


/* ==================================================
   显示后台
================================================== */

function showApp(){

  $('loginBox').style.display = 'none';

  $('app').style.display = 'block';

  $('logout').style.display = 'block';

  loadList();

  loadGlobalContact();
}


/* ==================================================
   登录
================================================== */

$('login').onclick = async () => {

  if(!sb){
    return msg('请配置 Supabase');
  }

  const {
    error
  } = await sb.auth.signInWithPassword({

    email:
      $('email').value,

    password:
      $('password').value

  });

  if(error){
    return msg(error.message);
  }

  showApp();

};


/* ==================================================
   退出
================================================== */

$('logout').onclick = async () => {

  await sb.auth.signOut();

  location.reload();

};


/* ==================================================
   读取资料卡
================================================== */

async function loadList(){

  const {
    data,
    error
  } =
    await sb
      .from('women')
      .select('*')
      .order(
        'sort_order',
        {
          ascending:true
        }
      )
      .order(
        'created_at',
        {
          ascending:false
        }
      );


  if(error){

    $('list').innerHTML =
      `<tr>
        <td colspan="6">
          ${esc(error.message)}
        </td>
      </tr>`;

    return;
  }


  $('list').innerHTML =
    (data || [])
      .map(w => `

        <tr>

          <td>

            <img
              class="mini"
              src="${esc(
                (w.photos || [])[0] || ''
              )}"
              alt=""
            >

          </td>

          <td>
            ${esc(w.name)}
          </td>

          <td>
            ${esc(w.age)}
          </td>

          <td>
            ${esc(w.city)}
          </td>

          <td>
            ${
              w.is_published
              ? '已发布'
              : '未发布'
            }
          </td>

          <td>

            <div class="actions">

              <button
                class="btn secondary"
                onclick='edit(
                  ${JSON.stringify(w)
                    .replace(/'/g,"&#39;")}
                )'
              >
                编辑
              </button>


              <button
                class="btn secondary"
                onclick="toggle(
                  '${w.id}',
                  ${!w.is_published}
                )"
              >
                ${
                  w.is_published
                  ? '下架'
                  : '发布'
                }
              </button>


              <button
                class="btn danger"
                onclick="
                  removeWoman('${w.id}')
                "
              >
                删除
              </button>

            </div>

          </td>

        </tr>

      `)
      .join('')

      ||
      `
        <tr>
          <td colspan="6">
            暂无资料
          </td>
        </tr>
      `;
}


/* ==================================================
   新增资料卡
================================================== */

$('addBtn').onclick = async () => {

  await openEditor(null);

};


$('cancel').onclick = () => {

  $('editor').style.display = 'none';

};


/* ==================================================
   获取全局联系方式
================================================== */

async function getGlobalContact(){

  const {
    data,
    error
  } =
    await sb
      .from('site_settings')
      .select(
        'whatsapp,telegram'
      )
      .eq(
        'setting_key',
        'profile_contact'
      )
      .maybeSingle();


  if(error){
    throw error;
  }


  return {

    whatsapp:
      data?.whatsapp || '',

    telegram:
      data?.telegram || ''

  };

}


/* ==================================================
   加载全局联系方式到后台
================================================== */

async function loadGlobalContact(){

  try{

    const contact =
      await getGlobalContact();


    /*
      全局 WhatsApp
    */

    const whatsappInput =
      $('profileWhatsapp');

    if(whatsappInput){

      whatsappInput.value =
        contact.whatsapp;

    }


    /*
      全局 Telegram
    */

    const telegramInput =
      $('profileTelegram');

    if(telegramInput){

      telegramInput.value =
        contact.telegram;

    }

  }catch(error){

    console.error(
      '加载资料卡全局联系方式失败:',
      error
    );

  }

}


/* ==================================================
   保存资料卡全局联系方式
   同时覆盖所有资料卡
================================================== */

async function saveGlobalContact(){

  const button =
    $('saveProfileSettingsButton');


  if(button){

    button.disabled = true;

    button.textContent =
      '正在覆盖全部资料卡……';

  }


  try{

    const whatsapp =
      (
        $('profileWhatsapp')?.value
        || ''
      ).trim();


    const telegram =
      (
        $('profileTelegram')?.value
        || ''
      ).trim();


    /*
      如果两个联系方式都是空，
      仍然允许保存。
      保存后会清空所有资料卡联系方式。
    */


    /* ------------------------------------------
       第一步：
       保存全局联系方式
    ------------------------------------------ */

    const {
      data:
        existingSetting,
      error:
        findError
    } =
      await sb
        .from('site_settings')
        .select('id')
        .eq(
          'setting_key',
          'profile_contact'
        )
        .maybeSingle();


    if(findError){
      throw findError;
    }


    let settingsError;


    if(existingSetting?.id){

      const result =
        await sb
          .from('site_settings')
          .update({

            whatsapp,

            telegram,

            updated_at:
              new Date().toISOString()

          })
          .eq(
            'id',
            existingSetting.id
          );


      settingsError =
        result.error;

    }else{

      const result =
        await sb
          .from('site_settings')
          .insert({

            setting_key:
              'profile_contact',

            whatsapp,

            telegram,

            updated_at:
              new Date().toISOString()

          });


      settingsError =
        result.error;

    }


    if(settingsError){
      throw settingsError;
    }


    /* ------------------------------------------
       第二步：
       覆盖所有女士资料卡
    ------------------------------------------ */

    const {
      error:
        womenError
    } =
      await sb
        .from('women')
        .update({

          whatsapp,

          telegram,

          updated_at:
            new Date().toISOString()

        })
        .not(
          'id',
          'is',
          null
        );


    if(womenError){
      throw womenError;
    }


    /* ------------------------------------------
       第三步：
       刷新资料卡列表
    ------------------------------------------ */

    await loadList();


    if(button){

      button.textContent =
        '保存成功';

    }


    alert(
      '全局联系方式修改成功！\n\n' +
      '所有资料卡的 WhatsApp 和 Telegram 已被新的联系方式覆盖。'
    );


  }catch(error){

    console.error(
      '保存全局联系方式失败:',
      error
    );


    alert(
      '保存失败：' +
      error.message
    );


  }finally{

    if(button){

      button.disabled = false;

      button.textContent =
        '保存并覆盖全部资料卡';

    }

  }

}


/* ==================================================
   绑定全局联系方式按钮
================================================== */

const globalContactButton =
  $('saveProfileSettingsButton');


if(globalContactButton){

  globalContactButton.onclick =
    saveGlobalContact;

}


/* ==================================================
   编辑资料卡
================================================== */

async function openEditor(w){

  $('editor').style.display =
    'block';


  $('editorTitle').textContent =
    w
    ? '编辑女士'
    : '添加女士';


  $('id').value =
    w?.id || '';


  [
    'name',
    'age',
    'city',
    'occupation',
    'height_cm',
    'marital_status',
    'short_intro',
    'bio',
    'hobbies',
    'whatsapp',
    'telegram'
  ]
  .forEach(k => {

    const input =
      $(k);

    if(!input){
      return;
    }

    input.value =
      w?.[k] ?? '';

  });


  /*
    新增资料卡：
    自动读取当前全局联系方式
  */

  if(!w){

    try{

      const contact =
        await getGlobalContact();


      if($('whatsapp')){

        $('whatsapp').value =
          contact.whatsapp;

      }


      if($('telegram')){

        $('telegram').value =
          contact.telegram;

      }

    }catch(error){

      console.warn(
        '读取全局联系方式失败:',
        error
      );

    }

  }


  if($('is_published')){

    $('is_published').checked =
      w
      ? !!w.is_published
      : true;

  }


  currentPhotos =
    w?.photos || [];


  renderPreview();

  fmsg('');

}


window.edit =
  openEditor;


/* ==================================================
   照片预览
================================================== */

function renderPreview(){

  $('preview').innerHTML =
    currentPhotos
      .map(
        (p,i) => `

          <div
            style="
              position:relative
            "
          >

            <img
              src="${esc(p)}"
              style="
                width:72px;
                height:88px;
                object-fit:cover
              "
            >

            <button
              type="button"
              onclick="
                removePhoto(${i})
              "
              style="
                position:absolute;
                right:0;
                top:0
              "
            >
              ×
            </button>

          </div>

        `
      )
      .join('');

}


window.removePhoto =
  i => {

    currentPhotos.splice(
      i,
      1
    );

    renderPreview();

  };


/* ==================================================
   照片选择
================================================== */

$('photos').onchange =
  e => {

    [
      ...e.target.files
    ]
    .forEach(file => {

      const u =
        URL.createObjectURL(file);

      currentPhotos.push(u);

    });


    renderPreview();

  };


/* ==================================================
   上传文件
================================================== */

async function uploadFiles(id){

  const files =
    [
      ...$('photos').files
    ];


  for(
    const file of files
  ){

    const ext =
      file.name
        .split('.')
        .pop()
        .toLowerCase();


    const path =
      `${id}/${crypto.randomUUID()}.${ext}`;


    const {
      error
    } =
      await sb
        .storage
        .from('women-photos')
        .upload(
          path,
          file,
          {
            upsert:false
          }
        );


    if(error){
      throw error;
    }


    const {
      data
    } =
      sb
        .storage
        .from('women-photos')
        .getPublicUrl(path);


    currentPhotos.push(
      data.publicUrl
    );

  }


  /*
    删除本地 blob 预览地址
  */

  currentPhotos =
    currentPhotos.filter(
      x =>
        !String(x)
          .startsWith('blob:')
    );

}


/* ==================================================
   保存资料卡
================================================== */

$('form').onsubmit =
  async e => {

    e.preventDefault();

    fmsg('保存中…');


    try{

      /*
        新增上传照片
      */

      let id =
        $('id').value
        ||
        crypto.randomUUID();


      await uploadFiles(id);


      /*
        联系方式
        单独保存资料卡自己的联系方式
      */

      const whatsapp =
        (
          $('whatsapp')?.value
          || ''
        )
        .replace(/\D/g,'');


      const telegram =
        (
          $('telegram')?.value
          || ''
        )
        .trim();


      const payload = {

        id,

        name:
          $('name').value.trim(),

        age:
          Number(
            $('age').value
          ),

        city:
          $('city').value.trim(),

        occupation:
          $('occupation').value.trim(),

        height_cm:
          $('height_cm').value
          ?
          Number(
            $('height_cm').value
          )
          :
          null,

        marital_status:
          $('marital_status')
            .value
            .trim(),

        short_intro:
          $('short_intro')
            .value
            .trim(),

        bio:
          $('bio')
            .value
            .trim(),

        hobbies:
          $('hobbies')
            .value
            .trim(),

        whatsapp,

        telegram,

        photos:
          currentPhotos,

        is_published:
          $('is_published')
            .checked,

        updated_at:
          new Date()
            .toISOString()

      };


      /*
        保存资料
      */

      const {
        error
      } =
        await sb
          .from('women')
          .upsert(
            payload
          );


      if(error){
        throw error;
      }


      fmsg(
        '保存成功'
      );


      $('photos').value =
        '';


      await loadList();


      setTimeout(
        () => {

          $('editor').style.display =
            'none';

        },
        500
      );


    }catch(err){

      console.error(err);

      fmsg(
        '保存失败：' +
        err.message
      );

    }

  };


/* ==================================================
   发布 / 下架
================================================== */

window.toggle =
  async (
    id,
    value
  ) => {

    const {
      error
    } =
      await sb
        .from('women')
        .update({

          is_published:
            value,

          updated_at:
            new Date()
              .toISOString()

        })
        .eq(
          'id',
          id
        );


    if(error){

      alert(
        error.message
      );

    }else{

      loadList();

    }

  };


/* ==================================================
   删除资料卡
================================================== */

window.removeWoman =
  async id => {

    if(
      !confirm(
        '确定删除这位女士的资料吗？'
      )
    ){

      return;

    }


    const {
      error
    } =
      await sb
        .from('women')
        .delete()
        .eq(
          'id',
          id
        );


    if(error){

      alert(
        error.message
      );

    }else{

      loadList();

    }

  };


/* ==================================================
   启动
================================================== */

boot();
