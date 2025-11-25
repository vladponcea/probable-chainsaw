'use client';

interface VideoSectionProps {
  title: string;
  description: string;
  videoUrl?: string;
}

export default function VideoSection({
  title,
  description,
  videoUrl,
}: VideoSectionProps) {
  return (
    <div className="w-full mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
        {videoUrl ? (
          <video
            src={videoUrl}
            controls
            className="w-full h-full rounded-lg"
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="text-center text-gray-500">
            <svg
              className="w-16 h-16 mx-auto mb-2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm">Video placeholder</p>
          </div>
        )}
      </div>
    </div>
  );
}

