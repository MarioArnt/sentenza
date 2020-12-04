import { readFileSync } from 'fs';
import { join } from 'path';

const quotes = [
  'Tuco the Ugly: If you work for a living, why do you kill yourself working?',
  'Tuco the Ugly: How much?',
  'Tuco the Ugly: There are two kinds of spurs, my friend. Those that come in by the door; those that come in by the window.',
  "Tuco the Ugly: If you save your breath I feel a man like you can manage it. And if you don't manage it, you'll die. Only slowly, very slowly old friend.",
  "Tuco the Ugly: BLONDY! YOU'RE A SON OF A...",
  'The Good: There are two kinds of people in the world those with guns and those that dig. You dig?',
  "Tuco the Ugly: When you have to shoot, shoot. Don't talk.",
  "The Good: I'll sleep better knowing my good friend is by my side to protect me.",
  "Tuco the Ugly: I'm innocent, I'm an innocent farmer.",
  'The Good: Every gun makes its own tune.',
  "Tuco the Ugly: When you have to shoot, shoot. Don't talk.",
  'Tuco the Ugly: (Trying to read) See you soon... idi... id...',
  'Tuco the Ugly: [trying to read] See you soon... idi... id...',
  "The Good: Idiots. It's for you.",
  'Tuco the Ugly: There are 2 kinds of spurs my friend, those who come through the door (sign of the cross) & those who come through the window!',
  'Tuco the Ugly: There are 2 kinds of spurs my friend, those who come through the door [sign of the cross] & those who come through the window!',
  "The Good: You see, in this world there's two kinds of people, my friend: Those with loaded guns and those who dig. You dig.",
  "The Bad: People with ropes around their necks don't always hang. Even a filthy beggar like that has a protecting angel. A golden-haired angel watches over him.",
  "The Good: If your friends stay out in the damp, they're liable to catch a cold, aren't they ? Or a bullet.",
  'Tuco the Ugly: I like big fat men like you. When they fall, they make more noise... and sometimes they never get up.',
  'Tuco the Ugly: God is with us because he hates the yanks too!',
  "The Good: God's not on our side 'cause he hates idiots also.",
  "The Good: [Reading a letter] See you soon, idiots. It's for you.",
  "Tuco the Ugly: If you want to shoot, just shoot don't start talking",
  "Tuco the Ugly: If you want to shoot, just shoot don't start talking.",
  'The Good: The way back to town is only seventy miles. So if you save your breath, I feel a man like you can manage it. Adios...',
  'The Good: Just like old times...1 2 3 4 Five for you...five for me...you know how much u worth now...???',
  'The Good: Just like old times...1 2 3 4 Five for you...five for me...you know how much u worth now...',
  'Tuco the Ugly: How much...???',
  'Tuco the Ugly: How much...',
  'The Good: 3000 Dollars...',
  'The Good: 3000 dollars...',
  "Tuco the Ugly: If you want to shoot, shoot, don't talk...",
  'The Good: to Tuco:There are two kinds of people in the world those with guns and those that dig. You dig...',
  'The Good: [to Tuco] There are two kinds of people in the world those with guns and those that dig. You dig?',
  'Tuco the Ugly: How much',
  'Tuco the Ugly: How much?',
  "Tuco the Ugly: You want to know who you are? Huh? Huh? You don't, I do, everyone does... you're the son of a thousand fathers, all bastards like you",
  "Tuco the Ugly: You want to know who you are? Huh? You want to know who's son you are? You don't, I do, everybody does... you're the son of a thousand fathers, all bastards like you.",
  "Tuco the Ugly: When you have to shoot...Shoot! Don't talk.",
  "Tuco the Ugly: When you have to shoot, shoot. Don't talk.",
  'Tuco the Ugly: If you work for a living, why do you kill yourself working?',
  "Tuco the Ugly: I'm looking for the owner of that horse. He's tall, blonde, he smokes a cigar, and he's a pig!",
  'Tuco the Ugly: There are two kinds of spurs, my friend. Those that come in by the door; those that come in by the window',
  'Tuco the Ugly: There are two kinds of spurs, my friend. Those that come in by the door, [crosses himself] those that come in by the window.',
  'The Good: Every gun makes its own tune.',
  "Tuco the Ugly: Don't die, I'll get you water. Stay there. Don't move, I'll get you water. Don't die until later",
  "Tuco the Ugly: Don't die, I'll get you water. Stay there. Don't move, I'll get you water. Don't die until later.",
  'Tuco the Ugly: One bastard goes in, another one comes out.',
  'The Good: [To Tuco] Such ingratitude after all the times I saved your life.',
  "The Good: [counting The Bad's men] One, two, three, four, five, and six. Six, the perfect number.",
  'The Bad: I thought three was the perfect number.',
  "The Good: I've got six more bullets in my gun.",
  'The Bad: Even a filthy beggar like that has got a protecting angel. [Referencing Tuco]',
  'Tuco the Ugly: Even when Judas hanged himself there was thunder.',
  "Tuco the Ugly: When you have to shoot, shoot. Don't talk.",
  "The Bad: Oh I almost forgot. He payed me a thousand. I think his idea was that I kill you. [Laugh] But you know the pity is when I'm paid, I always follow my job through. You know that.",
  "The Bad: Oh I almost forgot. He payed me a thousand. I think his idea was that I kill you. [Laugh] But you know the pity is when I'm paid, I always follow my job through. You know that.",
  "The Good: I've never seen so many men wasted so badly.",
  'The Good: You may run the risks, my friend, but I do the cutting. We cut down my percentage - uh, cigar? - liable to interfere with my aim.',
  'The Good: You may run the risks, my friend, but I do the cutting. We cut down my percentage - uh, cigar? - liable to interfere with my aim.',
  'Tuco the Ugly: But if you miss you had better miss very well. Whoever double-crosses me and leaves me alive, he understands nothing about Tuco. Nothing!',
  'Tuco the Ugly: But if you miss you had better miss very well. Whoever double-crosses me and leaves me alive, he understands nothing about Tuco. Nothing!',
];

const getRandomQuote = () => {
  return quotes[Math.floor(Math.random() * quotes.length)]
}

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
 '       \\\`                             ${provider ? `${provider.name} ${provider.version}` : ''}
'--------\\\`

 ${getRandomQuote()}
 `;
};
