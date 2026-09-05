import { headers } from 'next/headers';
import { resolveMetrikaConfig } from '@/shared/lib';

function buildInitScript(tagId: number) {
  return `window.dataLayer=window.dataLayer||[];
(function(m,e,t,r,i,k,a){
  m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
  m[i].l=1*new Date();
  for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
  k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window,document,"script","https://mc.yandex.ru/metrika/tag.js?id=${tagId}","ym");
ym(${tagId},"init",{defer:true,webvisor:true,clickmap:true,ecommerce:"dataLayer",accurateTrackBounce:true,trackLinks:true});`;
}

export async function MetrikaScript() {
  const requestHeaders = await headers();
  const requestHost = requestHeaders.get('host')?.split(':')[0] ?? '';
  const config = resolveMetrikaConfig(requestHost, process.env.NEXT_PUBLIC_METRIKA_ID);
  if (!config) return null;
  const initScript = buildInitScript(config.id);
  return (
    <>
      <script
        defer
        dangerouslySetInnerHTML={{ __html: initScript }}
      />
      <noscript>
        <div>
          <img
            alt=""
            src={`https://mc.yandex.ru/watch/${config.id}`}
            style={{ position: 'absolute', left: '-9999px' }}
          />
        </div>
      </noscript>
    </>
  );
}
