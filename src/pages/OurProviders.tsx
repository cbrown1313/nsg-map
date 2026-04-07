import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const OurProviders = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" />
          Back to Map
        </Link>
        <h1 className="text-2xl font-bold text-foreground mb-2">Our Providers</h1>
        <p className="text-muted-foreground">Provider directory coming soon.</p>
      </div>
    </div>
  );
};

export default OurProviders;
