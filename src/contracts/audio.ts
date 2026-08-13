export interface HermesAudioTranscriptionRequest {
  data_url: string;
  mime_type?: string | null;
}

export interface HermesAudioTranscriptionResponse {
  ok: boolean;
  provider?: string;
  transcript: string;
  [key: string]: unknown;
}

export interface HermesAudioSpeakRequest {
  text: string;
}

export interface HermesAudioSpeakResponse {
  ok: boolean;
  data_url: string;
  mime_type: string;
  provider?: string;
  [key: string]: unknown;
}

export interface HermesElevenLabsVoice {
  label: string;
  name: string;
  voice_id: string;
  [key: string]: unknown;
}

export interface HermesElevenLabsVoicesResponse {
  available: boolean;
  voices: HermesElevenLabsVoice[];
  [key: string]: unknown;
}

export interface HermesAudioApi {
  transcribe(input: HermesAudioTranscriptionRequest, profile?: string): Promise<HermesAudioTranscriptionResponse>;
  elevenLabsVoices(profile?: string): Promise<HermesElevenLabsVoicesResponse>;
  speak(input: HermesAudioSpeakRequest, profile?: string): Promise<HermesAudioSpeakResponse>;
}
