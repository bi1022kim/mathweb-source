// 고3 입시 스타일 음성 풀이 2문항. 기출을 옮기지 않고 같은 유형으로 새로 만든 문제다.
// speak는 화면 수식과 같은 내용을 음성 엔진이 읽을 수 있게 한글로 푼 것.

export type VoiceStep = {
  speak: string;
  latex: string;
  audio: string;
};

export type VoiceLesson = {
  id: string;
  subject: string;
  title: string;
  prompt: string;
  steps: VoiceStep[];
};

function matchingBrace(source: string, open: number): number {
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return source.length - 1;
}

// 수식을 왼쪽부터 이어 붙일 수 있는 조각으로 나눈다. 중괄호 안은 쪼개지 않는다.
function atomsOf(latex: string): string[] {
  const atoms: string[] = [];
  let i = 0;
  const pushScript = (chunk: string) => {
    while (i < latex.length && (latex[i] === "^" || latex[i] === "_")) {
      chunk += latex[i];
      i += 1;
      if (latex[i] === "{") {
        const end = matchingBrace(latex, i);
        chunk += latex.slice(i, end + 1);
        i = end + 1;
      } else if (i < latex.length) {
        chunk += latex[i];
        i += 1;
      }
    }
    atoms.push(chunk);
  };

  while (i < latex.length) {
    const ch = latex[i];
    if (ch === " " || ch === "\n") {
      if (atoms[atoms.length - 1] !== " ") atoms.push(" ");
      i += 1;
      continue;
    }
    if (ch === "\\") {
      if (latex[i + 1] === " ") {
        atoms.push("\\ ");
        i += 2;
        continue;
      }
      let j = i + 1;
      while (j < latex.length && /[a-zA-Z]/.test(latex[j])) j += 1;
      let chunk = latex.slice(i, j);
      i = j;
      if (/^\\(big[lrg]?|Big[lrg]?|left|right)$/.test(chunk) && i < latex.length && latex[i] !== "{") {
        chunk += latex[i];
        i += 1;
      }
      while (latex[i] === "{") {
        const end = matchingBrace(latex, i);
        chunk += latex.slice(i, end + 1);
        i = end + 1;
      }
      pushScript(chunk);
      continue;
    }
    if (ch === "{") {
      const end = matchingBrace(latex, i);
      pushScript(latex.slice(i, end + 1));
      continue;
    }
    if (ch === "'") {
      i += 1;
      const prev = atoms.pop() ?? "";
      pushScript(prev + "'");
      continue;
    }
    i += 1;
    pushScript(ch);
  }
  return atoms.filter((atom) => atom.length > 0);
}

// 판서처럼 보이게, 완성 식까지 한 조각씩 늘어나는 중간 식 목록.
export function writeFrames(latex: string): string[] {
  const frames: string[] = [];
  let acc = "";
  for (const atom of atomsOf(latex)) {
    acc += atom;
    if (acc.trim() && frames[frames.length - 1] !== acc) frames.push(acc);
  }
  if (frames.length === 0) frames.push(latex);
  return frames;
}

export const voiceLessons: VoiceLesson[] = [
  {
    id: "extrema",
    subject: "미적분 · 극값",
    title: "삼차함수의 극댓값과 극솟값",
    prompt: "함수 $f(x)=x^{3}-6x^{2}+9x+1$의 극댓값과 극솟값을 구하시오.",
    steps: [
      {
        speak: "극값을 구하려면 도함수가 영이 되는 점을 찾습니다. 도함수는 삼 엑스 제곱 빼기 십이 엑스 더하기 구입니다.",
        latex: "f'(x)=3x^{2}-12x+9",
        audio: "voice/extrema-1.m4a",
      },
      {
        speak: "인수분해하면 삼 곱하기, 엑스 빼기 일, 엑스 빼기 삼입니다. 그래서 엑스가 일일 때와 삼일 때 기울기가 영입니다.",
        latex: "f'(x)=3(x-1)(x-3)=0 \\quad\\Rightarrow\\quad x=1\\ \\text{또는}\\ x=3",
        audio: "voice/extrema-2.m4a",
      },
      {
        speak: "일보다 작을 때는 증가하고, 일과 삼 사이에서는 감소하고, 삼보다 클 때는 다시 증가합니다. 따라서 엑스 일에서 극대, 엑스 삼에서 극소입니다.",
        latex: "x<1:+ \\qquad 1<x<3:- \\qquad x>3:+",
        audio: "voice/extrema-3.m4a",
      },
      {
        speak: "엑스 일을 대입하면 일 빼기 육 더하기 구 더하기 일입니다. 극댓값은 오입니다.",
        latex: "f(1)=1-6+9+1=5",
        audio: "voice/extrema-4.m4a",
      },
      {
        speak: "엑스 삼을 대입하면 이십칠 빼기 오십사 더하기 이십칠 더하기 일입니다. 극솟값은 일입니다.",
        latex: "f(3)=27-54+27+1=1",
        audio: "voice/extrema-5.m4a",
      },
    ],
  },
  {
    id: "log",
    subject: "수학 I · 로그방정식",
    title: "진수 조건을 따지는 로그방정식",
    prompt: "$\\log_{2}(x-1)+\\log_{2}(x+1)=3$을 만족하는 실수 $x$를 모두 구하시오.",
    steps: [
      {
        speak: "로그의 진수는 영보다 커야 합니다. 엑스 빼기 일과 엑스 더하기 일이 모두 양수이므로, 엑스는 일보다 커야 합니다.",
        latex: "x-1>0,\\ x+1>0 \\quad\\Rightarrow\\quad x>1",
        audio: "voice/log-1.m4a",
      },
      {
        speak: "밑이 같으므로 합을 하나로 모으면, 로그 이의 엑스 빼기 일 곱하기 엑스 더하기 일은 삼입니다.",
        latex: "\\log_{2}\\bigl((x-1)(x+1)\\bigr)=3",
        audio: "voice/log-2.m4a",
      },
      {
        speak: "로그의 정의로 바꾸면, 엑스 제곱 빼기 일은 이의 삼제곱, 곧 팔입니다.",
        latex: "x^{2}-1=2^{3}=8",
        audio: "voice/log-3.m4a",
      },
      {
        speak: "엑스 제곱은 구이므로, 엑스는 삼 또는 마이너스 삼입니다.",
        latex: "x^{2}=9 \\quad\\Rightarrow\\quad x=3\\ \\text{또는}\\ x=-3",
        audio: "voice/log-4.m4a",
      },
      {
        speak: "진수 조건에서 엑스는 일보다 커야 하므로 마이너스 삼은 버립니다. 답은 엑스 삼입니다.",
        latex: "x>1\\ \\text{이므로}\\ x=3",
        audio: "voice/log-5.m4a",
      },
    ],
  },
];
