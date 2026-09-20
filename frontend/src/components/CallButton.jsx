import { VideoIcon } from "lucide-react";

function CallButton({ handleVideoCall }) {
  return (
    <div className="flex items-center justify-end">
      <button
        onClick={handleVideoCall}
        className="btn btn-success btn-sm border border-emerald-500/60 text-white shadow-sm"
        aria-label="Start video call"
      >
        <VideoIcon className="size-5" />
      </button>
    </div>
  );
}

export default CallButton;
