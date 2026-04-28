import Document, { Head, Html, Main, NextScript } from 'next/document';

export default class MyDocument extends Document {
  render() {
    const lang = this?.props?.__NEXT_DATA__?.props?.pageProps?._nextI18Next?.initialLocale || 'ru';
    return (
      <Html lang={lang}>
        <Head>
          <meta
            name="robots"
            content="noindex"
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
