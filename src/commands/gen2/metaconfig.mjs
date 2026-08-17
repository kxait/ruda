import { getMetaconfig } from '../../lib/meta/get-metaconfig.mjs';

export async function metaconfig() {
  const { metaconfigYmlText } = await getMetaconfig();

  console.log(metaconfigYmlText);
}
