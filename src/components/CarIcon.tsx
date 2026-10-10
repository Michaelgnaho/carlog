export default function CarIcon({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="14" fill="#F2B705" />
      <path d="M12 38l5-12c1-2.4 3-4 5.6-4h18.8c2.6 0 4.6 1.6 5.6 4l5 12v10a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-3H20v3a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2V38z" fill="#0F2A43" />
      <circle cx="20" cy="38" r="3" fill="#F2B705" />
      <circle cx="44" cy="38" r="3" fill="#F2B705" />
      <path d="M20 29h24l2.6 6H17.4z" fill="#F2B705" />
    </svg>
  );
}
