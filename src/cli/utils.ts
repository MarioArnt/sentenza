import { readFileSync } from 'fs';
import { join } from 'path';

export const printVersion = (provider?: { name: string; version: string }): string => {
  const version = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json')).toString()).version;
  return `
            (_/-------------_____________________________________________)
          \\\`|  /~~~~~~~~~~\\                                              |
           ;  |--------(-||______________________________________________|
           ;  |--------(-| ____________|
           ;  \\__________/'
         _/__         ___;
      ,~~    |  __----~~
     '        ~~|    (  |
    '      '~~  \\\`____'
   '      '
  '      \\\`                             Sentenza ${version}
 '       \\\`                             ${
    provider ? `${provider.name} ${provider.version}` : ''
  }
'--------\\\`
  `;
};
