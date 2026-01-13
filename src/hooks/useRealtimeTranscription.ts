"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createRealtimeService, TranscriptionEvent } from "@/lib/services/openai-realtime";

interface UseRealtimeTranscriptionOptions {
    apiKey: string;
    onTranscript?: (text: string, isFinal: boolean) => void;
    onError?: (error: Error) => void;
}

interface AudioLevel {
    current: number;
    average: number;
}

export function useRealtimeTranscription({
    apiKey,
    onTranscript,
    onError,
}: UseRealtimeTranscriptionOptions) {
    const [isRecording, setIsRecording] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const realtimeServiceRef = useRef<ReturnType<typeof createRealtimeService> | null>(null);
    const audioLevelRef = useRef<AudioLevel>({ current: 0, average: 0 });
    const animationFrameRef = useRef<number>(0);
    const accumulatedTranscriptRef = useRef("");

    const startRecording = useCallback(async () => {
        if (isRecording || !apiKey) {
            return;
        }

        try {
            setIsRecording(true);
            accumulatedTranscriptRef.current = "";

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 24000,
                }
            });

            audioContextRef.current = new AudioContext({ sampleRate: 24000 });
            const source = audioContextRef.current.createMediaStreamSource(stream);

            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = 256;
            analyserRef.current.smoothingTimeConstant = 0.8;
            source.connect(analyserRef.current);

            scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
            source.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(audioContextRef.current.destination);

            scriptProcessorRef.current.onaudioprocess = (event) => {
                if (!isConnected || !realtimeServiceRef.current) {
                    return;
                }

                const audioData = event.inputBuffer.getChannelData(0);

                if (audioData.length > 0) {
                    const float32Data = new Float32Array(audioData);
                    const int16Data = new Int16Array(float32Data.length);

                    for (let i = 0; i < float32Data.length; i++) {
                        const s = Math.max(-1, Math.min(1, float32Data[i]));
                        int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
                    }

                    realtimeServiceRef.current.sendAudio(int16Data.buffer);
                }
            };

            mediaRecorderRef.current = new MediaRecorder(stream);

            realtimeServiceRef.current = createRealtimeService(apiKey, {
                onTranscript: (event: TranscriptionEvent) => {
                    if (event.isFinal) {
                        accumulatedTranscriptRef.current += (accumulatedTranscriptRef.current ? " " : "") + event.transcript;
                        onTranscript?.(accumulatedTranscriptRef.current, true);
                    }
                },
                onError: (error: Error) => {
                    console.error("Realtime transcription error:", error);
                    onError?.(error);
                    setIsTranscribing(false);
                },
                onConnected: () => {
                    setIsConnected(true);
                    setIsTranscribing(true);
                },
                onDisconnected: () => {
                    setIsConnected(false);
                    setIsTranscribing(false);
                },
            });

            realtimeServiceRef.current.connect();

            updateAudioLevel();
        } catch (error) {
            console.error("Failed to start recording:", error);
            onError?.(error as Error);
            setIsRecording(false);
        }
    }, [isRecording, apiKey, isConnected, onTranscript, onError]);

    const stopRecording = useCallback(() => {
        if (!isRecording) {
            return;
        }

        mediaRecorderRef.current?.stop();
        scriptProcessorRef.current?.disconnect();
        audioContextRef.current?.close();
        realtimeServiceRef.current?.disconnect();

        setIsRecording(false);
        setIsTranscribing(false);
        setIsConnected(false);

        cancelAnimationFrame(animationFrameRef.current);
    }, [isRecording]);

    const updateAudioLevel = useCallback(() => {
        if (!isRecording || !analyserRef.current) {
            return;
        }

        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }

        const average = sum / dataArray.length;
        audioLevelRef.current.current = average;
        audioLevelRef.current.average = audioLevelRef.current.average * 0.9 + average * 0.1;

        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }, [isRecording]);

    const getCurrentAmplitude = useCallback(() => {
        return audioLevelRef.current.current;
    }, []);

    useEffect(() => {
        return () => {
            cancelAnimationFrame(animationFrameRef.current);
            stopRecording();
        };
    }, [stopRecording]);

    return {
        isRecording,
        isTranscribing,
        isConnected,
        startRecording,
        stopRecording,
        getCurrentAmplitude,
    };
}
