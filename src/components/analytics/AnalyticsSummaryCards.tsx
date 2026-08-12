interface SummaryCard {
  label: string;
  value: string;
}

interface AnalyticsSummaryCardsProps {
  cards: SummaryCard[];
}

export function AnalyticsSummaryCards({ cards }: AnalyticsSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-md border border-gray-200 p-3">
          <p className="text-xs text-gray-500">{card.label}</p>
          <p className="text-lg font-semibold text-gray-900">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
