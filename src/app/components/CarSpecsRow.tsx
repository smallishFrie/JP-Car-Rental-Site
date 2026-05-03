import { parseCategoryTokens, transmissionFromCategoryTokens, type TransmissionKind } from "@/lib/carDisplay";

type CarSpecsRowProps = {
  category: string;
  passengerCapacity: number | null;
  className?: string;
};

function IconSeats({ className }: { className?: string }) {
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
      <path
        d="M5 11V18M5 11H3.5C2.67 11 2 10.33 2 9.5V8C2 6.34 3.34 5 5 5H7M5 11H9M19 11V18M19 11H20.5C21.33 11 22 10.33 22 9.5V8C22 6.34 20.66 5 19 5H17M19 11H15M9 11H15M9 11V7C9 5.9 9.9 5 11 5H13C14.1 5 15 5.9 15 7V11M7 18V20M17 18V20"
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
            <IconSeats className="car-spec-chip-icon" aria-hidden />
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
