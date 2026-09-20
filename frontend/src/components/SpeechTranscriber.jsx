import { useRef, useState } from "react";

function SpeechTranscriber({ onFinalText, title = "Voice input" }) {
  const socketRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const processorRef = useRef(null);
  const streamRef = useRef(null);

  const [isRecording, setIsRecording] = useState(false);
  const [connected, setConnected] = useState(false);
  const [partialText, setPartialText] = useState("");
  const [lastText, setLastText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const stopTranscription = () => {
    sourceRef.current?.disconnect();
    processorRef.current?.disconnect();
    sourceRef.current = null;
    processorRef.current = null;

    audioContextRef.current?.close().catch(() => {});
    audioContextRef.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    const socket = socketRef.current;
    if (socket) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "end" }));
      }
      socket.close();
      socketRef.current = null;
    }

    setIsRecording(false);
    setConnected(false);
    setPartialText("");
  };

  const startTranscription = async () => {
    try {
      setErrorMessage("");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      setIsRecording(true);

      const apiUrl = import.meta.env.VITE_API_URL;
      const backendUrl = apiUrl
        ? apiUrl.replace(/\/api\/?$/, "")
        : import.meta.env.DEV
          ? "http://localhost:443"
          : window.location.origin;
      const websocketUrl = backendUrl.replace(/^http/, "ws");
      const socket = new WebSocket(`${websocketUrl}/ws/speech`);
      socketRef.current = socket;

      socket.onopen = () => setConnected(true);
      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "transcript.partial") {
          setPartialText(data.text || "");
        }

        if (data.type === "transcript.final") {
          const text = data.text?.trim();
          if (text) {
            setLastText(text);
            onFinalText?.(text);
          }
          setPartialText("");
        }

        if (data.type === "error" || data.type === "sarvam.closed") {
          setErrorMessage(data.error || data.reason || "Speech service error");
        }
      };
      socket.onerror = () => setErrorMessage("Speech connection error");
      socket.onclose = () => setConnected(false);

      await new Promise((resolve, reject) => {
        socket.addEventListener("open", resolve, { once: true });
        socket.addEventListener("error", reject, { once: true });
      });

      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      const silentOutput = audioContext.createGain();
      silentOutput.gain.value = 0;

      sourceRef.current = source;
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        if (socket.readyState !== WebSocket.OPEN) return;

        const input = event.inputBuffer.getChannelData(0);
        const resampled = resampleAudio(
          input,
          audioContext.sampleRate,
          16000
        );
        const pcm = convertFloat32ToInt16(resampled);

        socket.send(
          JSON.stringify({
            type: "audio",
            audio: arrayBufferToBase64(pcm.buffer),
          })
        );
      };

      source.connect(processor);
      processor.connect(silentOutput);
      silentOutput.connect(audioContext.destination);
    } catch (error) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setIsRecording(false);
      setConnected(false);
      setErrorMessage(
        error.name === "NotAllowedError"
          ? "Microphone permission was denied"
          : "Could not start speech input"
      );
    }
  };

  return (
    <div className="border border-base-300 bg-base-200/60 p-3">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-xs opacity-70">
          {!isRecording
            ? "off"
            : connected
              ? "listening"
              : "connecting"}
        </span>
        <button
          type="button"
          onClick={isRecording ? stopTranscription : startTranscription}
          className={`btn btn-xs ml-auto border ${
            isRecording
              ? "btn-error border-red-500/60"
              : "btn-success border-emerald-500/60"
          }`}
        >
          {isRecording ? "Stop" : "Mic"}
        </button>
      </div>
      {(partialText || lastText) && (
        <p className="mt-2 text-sm">
          {partialText || lastText}
        </p>
      )}
      {errorMessage && (
        <p className="mt-2 text-xs text-error">{errorMessage}</p>
      )}
    </div>
  );
}

function convertFloat32ToInt16(float32Array) {
  const buffer = new Int16Array(float32Array.length);

  for (let index = 0; index < float32Array.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, float32Array[index]));
    buffer[index] = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
  }

  return buffer;
}

function resampleAudio(input, inputSampleRate, outputSampleRate) {
  if (inputSampleRate === outputSampleRate) return input;

  const outputLength = Math.max(
    1,
    Math.round(input.length * outputSampleRate / inputSampleRate)
  );
  const output = new Float32Array(outputLength);
  const ratio = inputSampleRate / outputSampleRate;

  for (let index = 0; index < outputLength; index += 1) {
    const sourceIndex = index * ratio;
    const lowerIndex = Math.floor(sourceIndex);
    const upperIndex = Math.min(lowerIndex + 1, input.length - 1);
    const fraction = sourceIndex - lowerIndex;
    output[index] =
      input[lowerIndex] * (1 - fraction) +
      input[upperIndex] * fraction;
  }

  return output;
}

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(
      ...bytes.subarray(index, index + 0x8000)
    );
  }

  return btoa(binary);
}

export default SpeechTranscriber;