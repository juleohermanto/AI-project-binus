export type BotanicalStage =
  | 'seed'
  | 'sprout'
  | 'seedling'
  | 'sapling'
  | 'blooming'
  | 'full_bloom';

export interface BotanicalGrowth {
  stage: BotanicalStage;
  label: string;
  growthPercentage: number;
  description: string;
  asset: string;
}

const STAGE_DETAILS: Record<
  Exclude<BotanicalStage, never>,
  { label: string; description: string; asset: string }
> = {
  seed: {
    label: 'Bibit Tertidur',
    description: 'Bibit masih tertidur. Selesaikan satu tugas untuk mulai menumbuhkannya.',
    asset: '/assets/botanical/seed.svg',
  },
  sprout: {
    label: 'Tunas Kecil',
    description: 'Tunas kecil mulai muncul. Awal yang bagus, teruskan!',
    asset: '/assets/botanical/sprout.svg',
  },
  seedling: {
    label: 'Bibit Tumbuh',
    description: 'Bibit tumbuh sehat. Jaga ritme kecilmu.',
    asset: '/assets/botanical/seedling.svg',
  },
  sapling: {
    label: 'Pohon Muda',
    description: 'Pohon muda mulai kokoh. Kamu sedang on track.',
    asset: '/assets/botanical/sapling.svg',
  },
  blooming: {
    label: 'Mulai Berbunga',
    description: 'Mulai berbunga. Sedikit lagi menuju hari yang tuntas.',
    asset: '/assets/botanical/blooming.svg',
  },
  full_bloom: {
    label: 'Pohon Rimbun',
    description: 'Pohon rimbun! Semua tugas hari ini selesai.',
    asset: '/assets/botanical/full_bloom.svg',
  },
};

export function getBotanicalGrowth(completionPercentage: number): BotanicalGrowth {
  const growthPercentage = Math.min(100, Math.max(0, Math.round(completionPercentage)));

  let stage: BotanicalStage;

  if (growthPercentage >= 100) {
    stage = 'full_bloom';
  } else if (growthPercentage >= 76) {
    stage = 'blooming';
  } else if (growthPercentage >= 51) {
    stage = 'sapling';
  } else if (growthPercentage >= 26) {
    stage = 'seedling';
  } else if (growthPercentage >= 1) {
    stage = 'sprout';
  } else {
    stage = 'seed';
  }

  return {
    stage,
    growthPercentage,
    ...STAGE_DETAILS[stage],
  };
}
