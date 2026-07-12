import CartSimulator from '../components/CartSimulator';

export default function EcommercePage() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Campaign Simulator</h2>
          <p className="text-muted-foreground mt-1">
            Test dynamic discount rules and campaigns in a realistic e-commerce shopping cart environment.
          </p>
        </div>
      </div>
      <CartSimulator />
    </div>
  );
}
