"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const TABS = [
  { id: "analytics", label: "Analytics" },
  { id: "cars", label: "Cars" },
  { id: "bookings", label: "Bookings" },
  { id: "locations", label: "Dropoff Locations" },
  { id: "contacts", label: "Contact Options" },
  { id: "reviews", label: "Reviews" },
] as const;

export default function AdminTabs() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || "analytics";

  return (
    <nav className="admin-tabs" aria-label="Admin sections">
      <ul className="admin-tabs-list">
        {TABS.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <li key={tab.id}>
              <Link
                href={`/admin?tab=${tab.id}`}
                className="admin-tab"
                aria-current={isActive ? "page" : undefined}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
