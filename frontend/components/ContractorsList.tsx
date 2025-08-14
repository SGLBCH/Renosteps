export function ContractorsList() {
  const contractors = [
    {
      name: 'John Smith',
      role: 'General Contractor',
      phone: '555-123-4567'
    },
    {
      name: 'Sarah Johnson',
      role: 'Interior Designer',
      phone: '555-987-6543'
    },
    {
      name: 'Mike Williams',
      role: 'Plumber',
      phone: '555-456-7890'
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Contractors</h3>
      
      <div className="space-y-3">
        {contractors.map((contractor, index) => (
          <div 
            key={index}
            className="bg-secondary rounded-lg p-3 shadow-sm"
          >
            <div className="font-medium">{contractor.name}</div>
            <div className="text-sm text-muted-foreground">{contractor.role}</div>
            <div className="text-sm text-muted-foreground">{contractor.phone}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
