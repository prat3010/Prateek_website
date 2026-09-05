import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/components/ui/Portal', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@number-flow/react', () => ({
  default: ({ value }: { value: number }) => <span>{value}</span>,
}));

vi.mock('@/components/ui/MagneticButton', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { VoiceStudioPanel } from '../VoiceStudioPanel';
import type { RetrieverClient } from '@/lib/rag-client';
import type {
  VoiceSession,
  VoiceTurnResponse,
  VoiceSessionTelemetry,
  WebRtcSignalingMessage,
} from '@/lib/rag-types';

describe('VoiceStudioPanel Component', () => {
  const mockGetVoiceTelemetry = vi.fn();
  const mockCreateVoiceSession = vi.fn();
  const mockSendVoiceSignal = vi.fn();
  const mockSynthesizeSpeech = vi.fn();
  const mockSendVoiceTurn = vi.fn();
  const mockGetVoiceSession = vi.fn();

  const mockClient = {
    tenantId: 'tn_test_voice_123',
    getVoiceTelemetry: mockGetVoiceTelemetry,
    createVoiceSession: mockCreateVoiceSession,
    sendVoiceSignal: mockSendVoiceSignal,
    synthesizeSpeech: mockSynthesizeSpeech,
    sendVoiceTurn: mockSendVoiceTurn,
    getVoiceSession: mockGetVoiceSession,
  } as unknown as RetrieverClient;

  const sampleTelemetry: VoiceSessionTelemetry = {
    active_sessions_count: 5,
    average_turn_latency_ms: 172.8,
    audio_frames_processed: 28400,
    vad_speech_events_count: 520,
    whisper_engine: 'whisper_cpp_sovereign_edge',
    synthesis_engine: 'edge_neural_tts_streamer',
  };

  const sampleSession: VoiceSession = {
    session_id: 'vcs_test_session_abc',
    tenant_id: 'tn_test_voice_123',
    user_id: 'usr_unit_test',
    state: 'listening',
    config: {
      vad_sensitivity: 0.7,
      selected_voice: 'neural_natural',
      audio_codec: 'pcm16',
    },
    created_at: '2026-09-05T12:00:00Z',
    connected_at: '2026-09-05T12:00:01Z',
    total_turns: 0,
    last_ping_at: '2026-09-05T12:00:02Z',
  };

  const sampleSignalAnswer: WebRtcSignalingMessage = {
    session_id: 'vcs_test_session_abc',
    message_type: 'answer',
    sdp: 'v=0\r\ns=Retriever-Edge-Voice\r\nm=audio 9 RTP/SAVPF 111',
  };

  const sampleSynthesizeResponse = {
    text: 'Zero cloud audio egress confirmed.',
    chunks_count: 4,
    total_bytes: 38400,
    audio_base64: 'AAAA',
    sample_rate_hz: 16000,
    format: 'pcm16',
  };

  const sampleTurnResponse: VoiceTurnResponse = {
    turn: {
      turn_id: 'trn_test_456',
      session_id: 'vcs_test_session_abc',
      tenant_id: 'tn_test_voice_123',
      user_transcript: 'Verify sovereign zero-egress voice compliance.',
      agent_response_text: 'Sovereign zero-egress voice compliance verified 100%.',
      time_to_transcribe_ms: 36.5,
      time_to_first_audio_byte_ms: 128.4,
      total_turn_duration_ms: 164.9,
      created_at: '2026-09-05T12:00:10Z',
    },
    audio_base64: 'AAAA',
    chunks_count: 3,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetVoiceTelemetry.mockResolvedValue(sampleTelemetry);
    mockCreateVoiceSession.mockResolvedValue(sampleSession);
    mockSendVoiceSignal.mockResolvedValue(sampleSignalAnswer);
    mockSynthesizeSpeech.mockResolvedValue(sampleSynthesizeResponse);
    mockSendVoiceTurn.mockResolvedValue(sampleTurnResponse);
  });

  it('renders null when hidden is true', () => {
    const { container } = render(
      <VoiceStudioPanel hidden={true} client={mockClient} tenantId="tn_test_voice_123" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders header, badges, and loads telemetry when visible', async () => {
    render(<VoiceStudioPanel hidden={false} client={mockClient} tenantId="tn_test_voice_123" />);

    expect(
      screen.getByText(/Sovereign Edge Voice & Local Whisper \/ WebRTC Synthesis/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/M100 • v0\.85\.0/i)).toBeInTheDocument();
    expect(screen.getByText(/Platform Battery #20: Active/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(mockGetVoiceTelemetry).toHaveBeenCalled();
    });

    // Check telemetry values rendered
    expect(screen.getByText('5')).toBeInTheDocument(); // active_sessions_count
    expect(screen.getByText('28400')).toBeInTheDocument(); // audio_frames_processed
  });

  it('toggles microphone stream and establishes WebRTC signaling', async () => {
    render(<VoiceStudioPanel hidden={false} client={mockClient} tenantId="tn_test_voice_123" />);

    const micBtn = screen.getByText(/Activate Sovereign Mic/i);
    fireEvent.click(micBtn);

    await waitFor(() => {
      expect(mockCreateVoiceSession).toHaveBeenCalledWith(
        expect.objectContaining({
          vad_sensitivity: 0.65,
          selected_voice: 'neural_natural',
          audio_codec: 'pcm16',
        })
      );
      expect(mockSendVoiceSignal).toHaveBeenCalledWith(
        expect.objectContaining({
          session_id: 'vcs_test_session_abc',
          message_type: 'offer',
        })
      );
    });

    // Should display active session id and state
    expect(screen.getByText(/State: LISTENING/i)).toBeInTheDocument();
    expect(screen.getByText(/vcs_test_session_abc/i)).toBeInTheDocument();
    expect(screen.getByText(/Stop Voice Stream/i)).toBeInTheDocument();

    // Toggle off
    fireEvent.click(screen.getByText(/Stop Voice Stream/i));
    expect(screen.getByText(/State: IDLE/i)).toBeInTheDocument();
  });

  it('adjusts VAD sensitivity slider and changes speech timbre select', async () => {
    render(<VoiceStudioPanel hidden={false} client={mockClient} tenantId="tn_test_voice_123" />);

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '0.8' } });
    await waitFor(() => {
      expect(screen.getByText('80%')).toBeInTheDocument();
    });

    const timbreSelect = screen.getByDisplayValue(/Atlas \(Crisp & Technical\)/i);
    fireEvent.change(timbreSelect, { target: { value: 'neural_expressive' } });
    await waitFor(() => {
      expect(screen.getByDisplayValue(/Nova \(Warm & Conversational\)/i)).toBeInTheDocument();
    });
  });

  it('synthesizes speech and triggers speaking state', async () => {
    render(<VoiceStudioPanel hidden={false} client={mockClient} tenantId="tn_test_voice_123" />);

    const playBtn = screen.getByRole('button', { name: /Play/i });
    fireEvent.click(playBtn);

    await waitFor(() => {
      expect(mockSynthesizeSpeech).toHaveBeenCalledWith(
        expect.stringContaining('Zero cloud audio egress ensures total tenant sovereignty'),
        expect.objectContaining({
          selected_voice: 'neural_natural',
          speed: 1.0,
        })
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(/Synthesized 4 neural PCM16 chunks \(38400 bytes\) in sub-250ms TTFAB\./i)
      ).toBeInTheDocument();
    });
  });

  it('simulates a conversational turn and appends it to the ledger', async () => {
    render(<VoiceStudioPanel hidden={false} client={mockClient} tenantId="tn_test_voice_123" />);

    const turnInput = screen.getByPlaceholderText(/Simulate user voice query/i);
    fireEvent.change(turnInput, { target: { value: 'Verify sovereign zero-egress voice compliance.' } });

    const sendBtn = screen.getByRole('button', { name: /➤ Send/i });
    fireEvent.click(sendBtn);

    await waitFor(() => {
      expect(mockSendVoiceTurn).toHaveBeenCalledWith(
        expect.objectContaining({
          text_override: 'Verify sovereign zero-egress voice compliance.',
          selected_voice: 'neural_natural',
        })
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/Verify sovereign zero-egress voice compliance\./i)).toBeInTheDocument();
      expect(
        screen.getByText(/Sovereign zero-egress voice compliance verified 100%\./i)
      ).toBeInTheDocument();
      expect(screen.getByText(/TTFAB: 128ms/i)).toBeInTheDocument();
      expect(screen.getByText(/Total: 165ms/i)).toBeInTheDocument();
    });
  });

  it('runs seamlessly in fallback simulation mode when client is null', async () => {
    render(<VoiceStudioPanel hidden={false} client={null} tenantId="tn_demo" />);

    // Click mic in fallback mode
    const micBtn = screen.getByText(/Activate Sovereign Mic/i);
    fireEvent.click(micBtn);

    await waitFor(() => {
      expect(screen.getByText(/State: LISTENING/i)).toBeInTheDocument();
      expect(screen.getByText(/WebRTC full-duplex session established/i)).toBeInTheDocument();
    });
  });
});
