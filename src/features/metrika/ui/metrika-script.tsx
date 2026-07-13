const TAG_ID = 110706774;

const INIT_SCRIPT = `(function(m,e,t,r,i,k,a){
  m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
  m[i].l=1*new Date();
  for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window,document,"script","https://mc.yandex.ru/metrika/tag.js?id=${TAG_ID}","ym");
ym(${TAG_ID},"init",{defer:true,webvisor:true,clickmap:true,ecommerce:"dataLayer",accurateTrackBounce:true,trackLinks:true});`;

export function MetrikaScript() {
  return (
    <>
      <script
        defer
        dangerouslySetInnerHTML={{ __html: INIT_SCRIPT }}
      />
      <noscript>
        <div>
          <img
            alt=""
            src={`https://mc.yandex.ru/watch/${TAG_ID}`}
            style={{ position: 'absolute', left: '-9999px' }}
          />
        </div>
      </noscript>
    </>
  );
}
