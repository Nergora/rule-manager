import { useState, useEffect, useMemo } from 'react';
import { campaignApi, CampaignRuleInput, CampaignOutput, GeneralCampaign } from '../lib/api';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ShoppingCart, Plus, Minus, TicketPercent, CheckCircle2, Pencil, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import CampaignFormDialog from "./CampaignFormDialog";

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
}

const DUMMY_PRODUCTS: Product[] = [
  { id: '1', name: 'MacBook Pro 16"', price: 85000, category: 'Electronics', image: '💻' },
  { id: '2', name: 'iPhone 15 Pro', price: 65000, category: 'Electronics', image: '📱' },
  { id: '3', name: 'Nike Air Max', price: 3500, category: 'Clothing', image: '👟' },
  { id: '4', name: 'Coffee Maker', price: 4200, category: 'Home', image: '☕' },
  { id: '5', name: 'Wireless Headphones', price: 5800, category: 'Electronics', image: '🎧' },
];

export default function CartSimulator() {
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [customerType, setCustomerType] = useState('STANDARD');
  const [city, setCity] = useState('Istanbul');
  const [orderTime, setOrderTime] = useState(new Date().toISOString().slice(0, 16));
  
  const [campaigns, setCampaigns] = useState<GeneralCampaign[]>([]);
  const [discounts, setDiscounts] = useState<CampaignOutput[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<GeneralCampaign | undefined>(undefined);

  const fetchCampaigns = () => {
    campaignApi.getAllCampaigns().then(setCampaigns).catch(console.error);
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  }, [cart]);

  const productCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  useEffect(() => {
    if (totalAmount > 0) {
      evaluateCart();
    } else {
      setDiscounts([]);
    }
  }, [cart, customerType, city, orderTime]);

  const evaluateCart = async () => {
    setLoading(true);
    try {
      const input: CampaignRuleInput = {
        totalAmount,
        customerType,
        orderCount: 1,
        productCount,
        orderTime: new Date(orderTime).toISOString(),
        city,
        category: cart.length > 0 ? cart[0].product.category : '',
        usageCount: 0
      };

      const results = await campaignApi.evaluateCampaigns(input);
      setDiscounts(results);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(p => p.product.id === product.id);
      if (existing) {
        return prev.map(p => p.product.id === product.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(p => p.product.id === productId);
      if (existing && existing.quantity > 1) {
        return prev.map(p => p.product.id === productId ? { ...p, quantity: p.quantity - 1 } : p);
      }
      return prev.filter(p => p.product.id !== productId);
    });
  };

  const parseDiscountValue = (priceString: string) => {
    if (!priceString) return 0;
    const match = priceString.match(/([\d,\.]+)/);
    return match ? parseFloat(match[1].replace(',', '.')) : 0;
  };

  const totalDiscountValue = useMemo(() => {
    return discounts.reduce((sum, d) => sum + parseDiscountValue(d.totalDiscount), 0);
  }, [discounts]);

  const finalTotal = Math.max(0, totalAmount - totalDiscountValue);

  const handleDeleteCampaign = async (id: number) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await campaignApi.deleteCampaign(id);
      fetchCampaigns();
    } catch (e) {
      console.error(e);
      alert('Failed to delete campaign');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-4">
      
      {/* Left Column: Products & Context */}
      <div className="md:col-span-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Context</CardTitle>
            <CardDescription>Simulate the current user's profile and order environment.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Customer Type</Label>
              <Select value={customerType} onValueChange={(v) => setCustomerType(v || '')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                  <SelectItem value="CORP">Corporate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Select value={city} onValueChange={(v) => setCity(v || '')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Istanbul">Istanbul</SelectItem>
                  <SelectItem value="Ankara">Ankara</SelectItem>
                  <SelectItem value="Izmir">Izmir</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Order Time</Label>
              <Input 
                type="datetime-local" 
                value={orderTime} 
                onChange={(e) => setOrderTime(e.target.value)} 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <CardDescription>Add items to your cart to trigger campaigns.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {DUMMY_PRODUCTS.map(product => (
                <div key={product.id} className="border rounded-lg p-4 flex flex-col items-center text-center space-y-2 hover:border-primary transition-colors">
                  <div className="text-4xl">{product.image}</div>
                  <div className="font-semibold text-sm">{product.name}</div>
                  <div className="text-muted-foreground text-sm">{product.price.toLocaleString()} TL</div>
                  <Badge variant="outline">{product.category}</Badge>
                  <Button size="sm" className="w-full mt-2" onClick={() => addToCart(product)}>
                    Add to Cart
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TicketPercent className="h-5 w-5" />
                Active Campaigns
              </CardTitle>
            </div>
            <Button size="sm" onClick={() => {
              setEditingCampaign(undefined);
              setIsFormOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-1" /> New Campaign
            </Button>
          </CardHeader>
          <CardContent>
            {campaigns.length === 0 ? (
              <div className="text-muted-foreground text-sm py-4">No active campaigns found. Create one!</div>
            ) : (
              <ScrollArea className="h-48">
                <div className="space-y-2 pr-4">
                  {campaigns.map(c => (
                    <div key={c.id} className="flex justify-between items-center p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors">
                      <div>
                        <span className="font-bold text-primary mr-2">{c.code}</span> 
                        <span className="text-sm font-medium">{c.name}</span>
                        <div className="text-xs text-muted-foreground mt-1">{c.description}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => {
                          setEditingCampaign(c);
                          setIsFormOpen(true);
                        }}>
                          <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteCampaign(c.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Cart Summary */}
      <div className="md:col-span-4">
        <Card className="sticky top-4 shadow-lg border-primary/20">
          <CardHeader className="bg-primary/5 pb-4">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Your Cart
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {cart.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                Your cart is empty.
              </div>
            ) : (
              <div className="space-y-4">
                <ScrollArea className="max-h-[300px] pr-4">
                  <div className="space-y-3">
                    {cart.map(item => (
                      <div key={item.product.id} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span>{item.product.image}</span>
                          <span className="truncate max-w-[120px]" title={item.product.name}>
                            {item.product.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border rounded-md">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFromCart(item.product.id)}>
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-4 text-center text-xs">{item.quantity}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => addToCart(DUMMY_PRODUCTS.find(p => p.id === item.product.id)!)}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="font-medium w-16 text-right">
                            {(item.product.price * item.quantity).toLocaleString()} TL
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <hr className="border-border" />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{totalAmount.toLocaleString()} TL</span>
                  </div>

                  {discounts.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Applied Campaigns
                      </div>
                      {discounts.map((d, idx) => {
                        const val = parseDiscountValue(d.totalDiscount);
                        if (val <= 0 && !d.campaignProductDiscount) return null;
                        return (
                          <div key={idx} className="flex justify-between text-sm text-green-600">
                            <span>Discount</span>
                            <span>-{val.toLocaleString()} TL</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <hr className="border-border" />
                  
                  <div className="flex justify-between font-bold text-lg pt-2">
                    <span>Total</span>
                    <span>{finalTotal.toLocaleString()} TL</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button className="w-full" size="lg" disabled={cart.length === 0 || loading}>
              {loading ? 'Calculating...' : 'Checkout'}
            </Button>
          </CardFooter>
        </Card>
      </div>

    <CampaignFormDialog 
      open={isFormOpen} 
      onOpenChange={setIsFormOpen} 
      campaign={editingCampaign} 
      onSave={fetchCampaigns} 
    />
    </div>
  );
}
