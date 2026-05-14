export function makeServerSideProps(ns: string[]) {
  return async function getServerSideProps() {
    return {
      props: {},
      context: { channel: 'default-channel', locale: 'ru' },
    };
  };
}
