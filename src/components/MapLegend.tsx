const MapLegend = () => {
  const items = [
    { color: 'hsl(180, 55%, 23%)', label: 'Licensed Provider State' },
    { color: 'hsl(210, 50%, 53%)', label: 'PSYPACT Telehealth Coverage' },
    { color: 'hsl(230, 40%, 17%)', label: 'Clinic Location', isDot: true },
  ];

  return (
    <div className="flex flex-wrap gap-4 items-center justify-center p-4 rounded-lg border bg-card">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          {item.isDot ? (
            <div
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
          ) : (
            <div
              className="w-5 h-3.5 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
          )}
          <span className="text-sm text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default MapLegend;
