export interface AiGenerationRequest {
  systemPrompt: string;
  userPrompt: string;
  rawInput?: string;
}

export interface AiProvider {
  readonly name: string;
  readonly model: string;
  generate(request: AiGenerationRequest): Promise<string>;
}
