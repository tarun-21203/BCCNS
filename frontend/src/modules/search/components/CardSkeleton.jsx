export default function CardSkeleton() {
  return (
    <li className="acard acard-skeleton" aria-hidden="true">
      <span className="sk sk-sm" />
      <span className="sk sk-lg" />
      <span className="sk" />
      <span className="sk sk-md" />
    </li>
  );
}
