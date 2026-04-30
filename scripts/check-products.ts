import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const ids = [
  'cmok5smdo0031et7geapacakr', 'cmok5snsh0033et7garftj2m0', 'cmok5sp0800035et7gg609de8v',
  'cmok5sq7y0037et7gayrxbt94', 'cmok5srfo0039et7gr2brboeb', 'cmok5ssnf003bet7gsgg2hqi9',
  'cmok5stv0003det7glvkmglpb', 'cmok5sv2p003fet7gng7lk4na', 'cmok5swac003het7gir45mtep',
  'cmok5sxi2003jet7gq2o25g2j', 'cmok5sypr003let7gey0mpbxn', 'cmok5t01j003net7gx2towki8',
  'cmok659t400nhet7gzvi0sutk', 'cmok6579x00ndet7grg70dmaq', 'cmok658hn00nfet7gfe8lbptk',
  'cmok65icy00nvet7gteu61duq', 'cmok69nqo00nxet7g5vrz9kqj', 'cmok69owp00nzet7gf4h0z9b0',
  'cmok6a44r00o1et7g9d6q4djs', 'cmok6a5bw00o3et7gfh7n3l1f', 'cmok6b5c300o5et7gkk5c6h4k',
  'cmok6b6j100o7et7g1x6p0j0f', 'cmok6bc6j00oket7g5j44yfn3', 'cmok6bdg700omet7gk1p0d6ig',
  'cmok6cx7l00zhet7g6bmm8qoz', 'cmok6cyf900zjet7g8pe2jawo', 'cmok6czmw00zlet7gv57k8qe9',
  'cmok6d0ul00znet7gv4sehbhs', 'cmok6dli10013et7ghw4z0g2q', 'cmok6dmjx0015et7gt0d3l2h3',
  'cmok6du2c001pet7gigp5d2v5', 'cmok6duzx001ret7g6w4u2q0f', 'cmok6dz5h001vet7gpv3g6z55',
  'cmok6e1i2001xet7g9n5y3k8h', 'cmok6e2f1001zet7g8z1d0a2p', 'cmok6ej6r0029et7gwv1q5j7a',
];

(async () => {
  for (const id of ids) {
    const r = await p.product.count({ where: { id } });
    console.log(r > 0 ? 'OK' : 'MISSING', id);
  }
  await p.$disconnect();
})();
