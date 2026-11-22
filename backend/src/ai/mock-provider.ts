import type { AiGenerationRequest, AiProvider } from './ai-provider';

function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 3)}...`;
}

export class MockAiProvider implements AiProvider {
  readonly name = 'mock';
  readonly model = 'mock-v1';

  async generate(request: AiGenerationRequest): Promise<string> {
    const rawInput = request.rawInput ?? request.userPrompt;

    const lines = rawInput
      .split(/\r?\n|;/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 5);

    const inputs = lines.length > 0 ? lines : ['Menyelesaikan tugas dari brain dump'];

    const tasks = inputs.map((line, index) => {
      const title = truncate(line, 120);
      const score = Math.max(30, 90 - index * 15);

      return {
        title,
        description: `Tugas hasil brain dump: ${title}`,
        category: 'Lainnya',
        estimatedMinutes: 30 + index * 15,
        priorityScore: score,
        priorityReason: 'Dibuat oleh mock provider untuk pengembangan tanpa API key.',
        deadline: null,
        firstMicroStep: {
          title: truncate(`Buka dan siapkan: ${title}`, 200),
          estimatedMinutes: 10,
        },
        additionalSteps: [
          {
            title: 'Kerjakan bagian utama selama 15 menit',
            estimatedMinutes: 15,
          },
        ],
      };
    });

    return JSON.stringify({ tasks });
  }
}
