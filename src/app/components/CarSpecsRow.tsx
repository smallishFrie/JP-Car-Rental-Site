import { parseCategoryTokens, transmissionFromCategoryTokens, type TransmissionKind } from "@/lib/carDisplay";

type CarSpecsRowProps = {
  category: string;
  passengerCapacity: number | null;
  className?: string;
};

function IconPerson({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="12" cy="8" r="3.25" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M6.5 20.25v-.75c0-2.35 2.2-4.25 5.5-4.25s5.5 1.9 5.5 4.25v.75"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconManual({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 3v3M9 6l-1.5 2.5M15 6l1.5 2.5M6 10h12M8 10v8a2 2 0 002 2h4a2 2 0 002-2v-8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 14h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconAutomatic({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 7v2.5M12 14.5V17M9.2 9.2l1.8 1.8M13 13l1.8 1.8M14.8 9.2L13 11"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function transmissionLabel(kind: TransmissionKind) {
  return kind === "manual" ? "Manual" : "Automatic";
}

export default function CarSpecsRow({ category, passengerCapacity, className = "" }: CarSpecsRowProps) {
  const tokens = parseCategoryTokens(category);
  const transmission = transmissionFromCategoryTokens(tokens);
  const hasSeats = passengerCapacity != null;

  if (!hasSeats && !transmission) {
    return null;
  }

  return (
    <div className={`car-specs-row ${className}`.trim()}>
      <div className="car-specs-row-chips">
        {hasSeats ? (
          <span
            className="car-spec-chip car-spec-chip-seats"
            title="Passenger capacity"
            aria-label={`${passengerCapacity} seats`}
          >
            <span className="car-spec-chip-value">{passengerCapacity}</span>
            <IconPerson className="car-spec-chip-icon" aria-hidden />
          </span>
        ) : null}

        {transmission ? (
          <span
            className={`car-spec-chip car-spec-chip-trans car-spec-chip-trans-${transmission}`}
            title={transmissionLabel(transmission)}
            aria-label={transmissionLabel(transmission)}
          >
            {transmission === "manual" ? (
              <IconManual className="car-spec-chip-icon" />
            ) : (
              <IconAutomatic className="car-spec-chip-icon" />
            )}
            <span>{transmissionLabel(transmission)}</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}
