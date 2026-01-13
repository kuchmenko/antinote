"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseCloudflareTranscriptionOptions {
    wsUrl: string;
    onTranscript?: (text: string, isFinal: boolean) => void;
    onError?: (error: Error) => void;
}

interface AudioLevel {
    current: number;
    average: number;
}

export function useCloudflareTranscription({
    wsUrl,
    onTranscript,
    onError,
}: UseCloudflareTranscriptionOptions) {
    const [isRecording, setIsRecording] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const audioLevelRef = useRef<AudioLevel>({ current: 0, average: 0 });
    const animationFrameRef = useRef<number>(0);

    const startRecording = useCallback(async () => {
        if (isRecording || !wsUrl) {
            return;
        }

        try {
            setIsRecording(true);

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

            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                console.log("Connected to Cloudflare Worker WebSocket");
                setIsConnected(true);
                setIsTranscribing(true);
            };

            wsRef.current.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);

                    if (message.type === "transcription") {
                        const { isFinal, transcript } = message;
                        if (transcript) {
                            onTranscript?.(transcript, isFinal);
                        }
                    } else if (message.type === "error") {
                        onError?.(new Error(message.message || "WebSocket error"));
                        setIsTranscribing(false);
                    } else if (message.type === "pong") {
                        console.log("Received pong from server");
                    }
                } catch (error) {
                    console.error("Failed to parse message:", error);
                }
            };

            wsRef.current.onerror = (error) => {
                console.error("WebSocket error:", error);
                onError?.(new Error("WebSocket connection failed"));
                setIsTranscribing(false);
            };

            wsRef.current.onclose = () => {
                console.log("WebSocket closed");
                setIsConnected(false);
                setIsTranscribing(false);
            };

            scriptProcessorRef.current.onaudioprocess = (event) => {
                if (!isConnected || wsRef.current?.readyState !== WebSocket.OPEN) {
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

                    const base64 = bufferToBase64(int16Data.buffer);
                    wsRef.current?.send(JSON.stringify({
                        type: "audio",
                        audio: base64
                    }));
                }
            };

            updateAudioLevel();
        } catch (error) {
            console.error("Failed to start recording:", error);
            onError?.(error as Error);
            setIsRecording(false);
        }
    }, [isRecording, wsUrl, isConnected, onTranscript, onError]);

    const stopRecording = useCallback(() => {
        if (!isRecording) {
            return;
        }

        scriptProcessorRef.current?.disconnect();
        audioContextRef.current?.close();
        wsRef.current?.close();

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

function bufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const len = bytes.byteLength;

    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
}
