import { Phone } from 'lucide-react';
import USMap from '@/components/USMap';
import MapLegend from '@/components/MapLegend';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Neurocognitive Specialty Group
            </h1>
            <p className="text-sm text-muted-foreground">Our Locations & Service Coverage</p>
          </div>
          <a
            href="tel:8886060086"
            className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <Phone className="h-4 w-4" />
            (888) 606-0086
          </a>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Serving Patients Across the Nation
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              NSG provides neuropsychological evaluations and telehealth services
              across multiple states. Click a highlighted state or clinic pin to
              learn more.
            </p>
          </div>

          {/* Map */}
          <div className="rounded-lg border bg-card p-4 md:p-6">
            <USMap />
          </div>

          {/* Legend */}
          <MapLegend />
        </div>
      </main>
    </div>
  );
};

export default Index;
