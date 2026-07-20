export function MemberStoryVideo({ src, title }: { src: string; title: string }) {
  return (
    <video
      src={src}
      className="h-full w-full"
      controls
      autoPlay
      playsInline
      aria-label={title}
    />
  );
}
