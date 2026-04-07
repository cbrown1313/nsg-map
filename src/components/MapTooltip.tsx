import { X, Phone } from 'lucide-react';
import { STATE_NAMES } from '@/data/locations';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';

interface MapTooltipProps {
  stateCode: string;
  position: { x: number; y: number };
  onClose: () => void;
}

const TooltipBody = ({ stateName }: { stateName: string }) => (
  <>
    <p className="text-sm text-muted-foreground leading-relaxed">
      Telehealth neuropsychology services are available in {stateName} through
      NSG's PSYPACT-credentialed providers. Services in states where NSG does
      not hold a direct state license are private pay only. Contact us to learn
      more and get started.
    </p>
    <div className="mt-3 flex items-center gap-2 text-sm text-primary font-medium">
      <Phone className="h-3.5 w-3.5" />
      <a href="tel:8886060086">(888) 606-0086</a>
    </div>
  </>
);

const MapTooltip = ({ stateCode, position, onClose }: MapTooltipProps) => {
  const stateName = STATE_NAMES[stateCode] || stateCode;
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open onOpenChange={(open) => !open && onClose()}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>{stateName}</DrawerTitle>
            <DrawerClose className="absolute top-3 right-3 p-1 rounded-sm hover:bg-accent">
              <X className="h-4 w-4 text-muted-foreground" />
            </DrawerClose>
          </DrawerHeader>
          <div className="px-4 pb-6">
            <TooltipBody stateName={stateName} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <div
      className="absolute z-50 w-80 rounded-lg border bg-card text-card-foreground shadow-lg p-4 animate-in fade-in-0 zoom-in-95"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -110%)',
      }}
    >
      <button
        onClick={onClose}
        className="absolute top-2 right-2 p-1 rounded-sm hover:bg-accent transition-colors"
        aria-label="Close"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
      <h3 className="font-semibold text-foreground mb-2">{stateName}</h3>
      <TooltipBody stateName={stateName} />
    </div>
  );
};

export default MapTooltip;
